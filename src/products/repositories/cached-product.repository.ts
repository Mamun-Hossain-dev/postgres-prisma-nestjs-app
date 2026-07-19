import { Injectable } from '@nestjs/common';
import { RedisService } from '../../redis/redis.service';
import {
  CreateProductInput,
  NewProductImage,
  Product,
  UpdateProductInput,
} from '../interfaces/product.interface';
import type { ProductRepository } from './product.repository';

@Injectable()
export class CachedProductRepository implements ProductRepository {
  private readonly cacheTtlInSeconds = 60 * 5;

  constructor(
    private readonly redis: RedisService,
    private readonly repository: ProductRepository,
  ) {}

  async findAll(): Promise<Product[]> {
    const cacheKey = this.getAllCacheKey();
    const cachedProducts = await this.redis.get(cacheKey);

    if (cachedProducts) {
      return JSON.parse(cachedProducts) as Product[];
    }

    const products = await this.repository.findAll();

    await this.redis.set(
      cacheKey,
      JSON.stringify(products),
      this.cacheTtlInSeconds,
    );

    return products;
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

  async create(
    input: CreateProductInput,
    images: NewProductImage[] = [],
  ): Promise<Product> {
    const product = await this.repository.create(input, images);

    await this.cacheProduct(product);
    await this.redis.del(this.getAllCacheKey());

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
    await this.redis.del(this.getAllCacheKey());

    return updatedProduct;
  }

  async delete(id: number): Promise<void> {
    await this.repository.delete(id);

    await Promise.all([
      this.redis.del(this.getIdCacheKey(id)),
      this.redis.del(this.getAllCacheKey()),
    ]);
  }

  async addImages(
    id: number,
    images: NewProductImage[],
  ): Promise<Product | null> {
    const product = await this.repository.addImages(id, images);

    if (!product) return null;

    await this.cacheProduct(product);
    await this.redis.del(this.getAllCacheKey());
    return product;
  }

  findImage(productId: number, imageId: number) {
    return this.repository.findImage(productId, imageId);
  }

  async deleteImage(productId: number, imageId: number): Promise<void> {
    await this.repository.deleteImage(productId, imageId);
    await Promise.all([
      this.redis.del(this.getIdCacheKey(productId)),
      this.redis.del(this.getAllCacheKey()),
    ]);
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

  private getAllCacheKey(): string {
    return 'product:all';
  }
}
