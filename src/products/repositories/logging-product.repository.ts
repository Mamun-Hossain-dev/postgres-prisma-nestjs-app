import { Injectable, Logger } from '@nestjs/common';
import { CachedProductRepository } from './cached-product.repository';
import type { ProductRepository } from './product.repository';
import type {
  CreateProductInput,
  NewProductImage,
  UpdateProductInput,
} from '../interfaces/product.interface';

@Injectable()
export class LoggingProductRepository implements ProductRepository {
  private readonly logger = new Logger(LoggingProductRepository.name);

  constructor(private readonly repository: CachedProductRepository) {}

  async findAll() {
    this.logger.log('Fetching all products');
    return await this.repository.findAll();
  }

  async findById(id: number) {
    this.logger.log(`Fetching product ${id}`);
    return await this.repository.findById(id);
  }

  async create(input: CreateProductInput) {
    this.logger.log('Creating product');
    return await this.repository.create(input);
  }

  async update(id: number, input: UpdateProductInput) {
    this.logger.log(`Updating product ${id}`);
    return await this.repository.update(id, input);
  }

  async delete(id: number) {
    this.logger.log(`Deleting product ${id}`);
    return await this.repository.delete(id);
  }

  async addImages(id: number, images: NewProductImage[]) {
    this.logger.log(`Adding ${images.length} images to product ${id}`);
    return this.repository.addImages(id, images);
  }

  async findImage(productId: number, imageId: number) {
    return this.repository.findImage(productId, imageId);
  }

  async deleteImage(productId: number, imageId: number) {
    this.logger.log(`Deleting image ${imageId} from product ${productId}`);
    return this.repository.deleteImage(productId, imageId);
  }
}
