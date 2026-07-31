import { Injectable } from '@nestjs/common';
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

@Injectable()
export class CachedProductRepository implements ProductRepository {
  private readonly cacheTtlInSeconds = 60 * 5;
  private readonly collectionsCachePrefix = 'product:collections:';

  constructor(
    private readonly redis: RedisService,
    private readonly repository: ProductRepository,
  ) {}

  findAll(options: ProductListOptions) {
    return this.repository.findAll(options);
  }

  async findById(id: number): Promise<Product | null> {
    const cacheKey = this.getIdCacheKey(id);
    const cachedProduct = await this.redis.get(cacheKey);

    if (cachedProduct) {
      return JSON.parse(cachedProduct) as Product;
    }

    const product = await this.repository.findById(id);

    if (product) {
      await this.cacheProduct(product);
    }

    return product;
  }

  async findCollections(limit: number): Promise<ProductCollections> {
    const cacheKey = `${this.collectionsCachePrefix}${limit}`;
    const cached = await this.redis.get(cacheKey);
    if (cached) return JSON.parse(cached) as ProductCollections;

    const collections = await this.repository.findCollections(limit);
    await this.redis.set(
      cacheKey,
      JSON.stringify(collections),
      this.cacheTtlInSeconds,
    );
    return collections;
  }

  async create(
    input: CreateProductInput,
    images: NewProductImage[] = [],
  ): Promise<Product> {
    const product = await this.repository.create(input, images);

    await this.cacheProduct(product);
    await this.invalidateCollections();

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
    await this.invalidateCollections();

    return updatedProduct;
  }

  async delete(id: number): Promise<void> {
    await this.repository.delete(id);

    await this.redis.del(this.getIdCacheKey(id));
    await this.invalidateCollections();
  }

  async addImages(
    id: number,
    images: NewProductImage[],
  ): Promise<Product | null> {
    const product = await this.repository.addImages(id, images);

    if (!product) return null;

    await this.cacheProduct(product);
    await this.invalidateCollections();
    return product;
  }

  findImage(productId: number, imageId: number) {
    return this.repository.findImage(productId, imageId);
  }

  async deleteImage(productId: number, imageId: number): Promise<void> {
    await this.repository.deleteImage(productId, imageId);
    await this.redis.del(this.getIdCacheKey(productId));
    await this.invalidateCollections();
  }

  private async cacheProduct(product: Product): Promise<void> {
    await this.redis.set(
      this.getIdCacheKey(product.id),
      JSON.stringify(product),
      this.cacheTtlInSeconds,
    );
  }

  private getIdCacheKey(id: number): string {
    return `product:id:${id}`;
  }

  private async invalidateCollections(): Promise<void> {
    await this.redis.deleteByPattern(`${this.collectionsCachePrefix}*`);
  }
}
