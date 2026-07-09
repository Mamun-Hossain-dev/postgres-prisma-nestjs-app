import { Injectable, Logger } from '@nestjs/common';
import { CreateProductDto } from '../dto/create-product.dto';
import { UpdateProductDto } from '../dto/update-product.dto';
import { CachedProductRepository } from './cached-product.repository';
import { ProductRepository } from './product.repository';

@Injectable()
export class LoggingProductRepository extends ProductRepository {
  private readonly logger = new Logger(LoggingProductRepository.name);

  constructor(private readonly repository: CachedProductRepository) {
    super();
  }

  async findAll() {
    this.logger.log('Fetching all products');
    return await this.repository.findAll();
  }

  async findById(id: number) {
    this.logger.log(`Fetching product ${id}`);
    return await this.repository.findById(id);
  }

  async create(dto: CreateProductDto) {
    this.logger.log('Creating product');
    return await this.repository.create(dto);
  }

  async update(id: number, dto: UpdateProductDto) {
    this.logger.log(`Updating product ${id}`);
    return await this.repository.update(id, dto);
  }

  async delete(id: number) {
    this.logger.log(`Deleting product ${id}`);
    return await this.repository.delete(id);
  }
}
