import { createHash } from 'node:crypto';
import { Injectable, Logger } from '@nestjs/common';
import { RedisService } from '../../../infrastructure/redis/redis.service';
import {
  CreateProductInput,
  NewProductImage,
  Product,
  UpdateProductInput,
  ProductListOptions,
  ProductCollections,
} from '../interfaces/product.interface';
import type { ProductRepository } from './product.repository';
import type { RepositoryPaginatedResult } from '../../../common/interfaces/pagination.interface';

@Injectable()
export class CachedProductRepository implements ProductRepository {
  private readonly logger = new Logger(CachedProductRepository.name);
  private readonly cacheTtlInSeconds = 60 * 5;
  private readonly listCacheTtlInSeconds = 60;
  private readonly listCachePrefix = 'product:list:v1:';
  private readonly collectionsCachePrefix = 'product:collections:';
  private readonly listLoads = new Map<
    string,
    Promise<RepositoryPaginatedResult<Product>>
  >();

  constructor(
    private readonly redis: RedisService,
    private readonly repository: ProductRepository,
  ) {}

  async findAll(
    options: ProductListOptions,
  ): Promise<RepositoryPaginatedResult<Product>> {
    const cacheKey = this.getListCacheKey(options);
    const cached =
      await this.readJsonCache<RepositoryPaginatedResult<Product>>(cacheKey);
    if (cached) {
      return cached;
    }

    const existingLoad = this.listLoads.get(cacheKey);
    if (existingLoad) return existingLoad;

    const load = this.repository
      .findAll(options)
      .then(async (result) => {
        await Promise.all([
          this.writeCache(
            cacheKey,
            JSON.stringify(result),
            this.listCacheTtlInSeconds,
          ),
          this.cacheProducts(result.data),
        ]);
        return result;
      })
      .finally(() => this.listLoads.delete(cacheKey));
    this.listLoads.set(cacheKey, load);
    return load;
  }

  async findById(id: number): Promise<Product | null> {
    const cacheKey = this.getIdCacheKey(id);
    const cachedProduct = await this.readJsonCache<Product>(cacheKey);

    if (cachedProduct) {
      return cachedProduct;
    }

    const product = await this.repository.findById(id);

    if (product) {
      await this.cacheProduct(product);
    }

    return product;
  }

  async findCollections(limit: number): Promise<ProductCollections> {
    const cacheKey = `${this.collectionsCachePrefix}${limit}`;
    const cached = await this.readJsonCache<ProductCollections>(cacheKey);
    if (cached) return cached;

    const collections = await this.repository.findCollections(limit);
    await this.writeCache(
      cacheKey,
      JSON.stringify(collections),
      this.cacheTtlInSeconds,
    );
    return collections;
  }

  getOperationsSummary() {
    return this.repository.getOperationsSummary();
  }

  async adjustStock(
    id: number,
    quantity: number,
    adjustedById: number,
    reason: string,
  ) {
    const result = await this.repository.adjustStock(
      id,
      quantity,
      adjustedById,
      reason,
    );
    if (result) {
      await this.cacheProduct(result.product);
      await this.invalidateCatalogLists();
    }
    return result;
  }

  async create(
    input: CreateProductInput,
    images: NewProductImage[] = [],
  ): Promise<Product> {
    const product = await this.repository.create(input, images);

    await this.cacheProduct(product);
    await this.invalidateCatalogLists();

    return product;
  }

  async update(
    id: number,
    input: UpdateProductInput,
    images: NewProductImage[] = [],
  ): Promise<Product | null> {
    const updatedProduct = await this.repository.update(id, input, images);

    if (!updatedProduct) {
      return null;
    }

    await this.cacheProduct(updatedProduct);
    await this.invalidateCatalogLists();

    return updatedProduct;
  }

  async delete(id: number): Promise<void> {
    await this.repository.delete(id);

    await this.deleteCacheKey(this.getIdCacheKey(id));
    await this.invalidateCatalogLists();
  }

  async addImages(
    id: number,
    images: NewProductImage[],
  ): Promise<Product | null> {
    const product = await this.repository.addImages(id, images);

    if (!product) return null;

    await this.cacheProduct(product);
    await this.invalidateCatalogLists();
    return product;
  }

  findImage(productId: number, imageId: number) {
    return this.repository.findImage(productId, imageId);
  }

  async deleteImage(productId: number, imageId: number): Promise<void> {
    await this.repository.deleteImage(productId, imageId);
    await this.deleteCacheKey(this.getIdCacheKey(productId));
    await this.invalidateCatalogLists();
  }

  private async cacheProduct(product: Product): Promise<void> {
    await this.writeCache(
      this.getIdCacheKey(product.id),
      JSON.stringify(product),
      this.cacheTtlInSeconds,
    );
  }

  private async cacheProducts(products: Product[]): Promise<void> {
    try {
      await this.redis.setMany(
        products.map((product) => ({
          key: this.getIdCacheKey(product.id),
          value: JSON.stringify(product),
        })),
        this.cacheTtlInSeconds,
      );
    } catch {
      this.logger.warn('Product detail cache warm-up failed');
    }
  }

  private getIdCacheKey(id: number): string {
    return `product:id:${id}`;
  }

  private getListCacheKey(options: ProductListOptions): string {
    const normalized = {
      skip: options.skip,
      take: options.take,
      search: options.search?.trim().toLowerCase() || null,
      category: options.category ?? null,
      brand: options.brand?.trim().toLowerCase() || null,
      minPrice: options.minPrice ?? null,
      maxPrice: options.maxPrice ?? null,
      featured: options.featured ?? null,
      status: options.status ?? null,
      onSale: options.onSale ?? null,
      publishedBefore: options.publishedBefore?.toISOString() ?? null,
      sort: options.sort ?? null,
    };
    const hash = createHash('sha256')
      .update(JSON.stringify(normalized))
      .digest('hex');
    return `${this.listCachePrefix}${hash}`;
  }

  private async invalidateCatalogLists(): Promise<void> {
    const results = await Promise.allSettled([
      this.redis.deleteByPattern(`${this.listCachePrefix}*`),
      this.redis.deleteByPattern(`${this.collectionsCachePrefix}*`),
    ]);
    if (results.some((result) => result.status === 'rejected')) {
      this.logger.warn('Product cache invalidation failed');
    }
  }

  private async readCache(key: string): Promise<string | null> {
    try {
      return await this.redis.get(key);
    } catch {
      this.logger.warn('Product cache read failed; using PostgreSQL');
      return null;
    }
  }

  private async readJsonCache<T>(key: string): Promise<T | null> {
    const value = await this.readCache(key);
    if (!value) return null;

    try {
      return JSON.parse(value) as T;
    } catch {
      this.logger.warn(`Discarding invalid product cache entry: ${key}`);
      await this.deleteCacheKey(key);
      return null;
    }
  }

  private async writeCache(
    key: string,
    value: string,
    ttl: number,
  ): Promise<void> {
    try {
      await this.redis.set(key, value, ttl);
    } catch {
      this.logger.warn('Product cache write failed; response was not cached');
    }
  }

  private async deleteCacheKey(key: string): Promise<void> {
    try {
      await this.redis.del(key);
    } catch {
      this.logger.warn('Product cache key deletion failed');
    }
  }
}
