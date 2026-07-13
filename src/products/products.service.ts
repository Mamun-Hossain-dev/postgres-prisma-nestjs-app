import { Injectable } from '@nestjs/common';
import { ProductRepository } from './repositories/product.repository';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { Product } from './interfaces/product.interface';
import { AppException } from '../common/exceptions/app.exception';

@Injectable()
export class ProductsService {
  constructor(private readonly productsRepository: ProductRepository) {}

  async getAllProducts(): Promise<Product[]> {
    return await this.productsRepository.findAll();
  }

  async getProductById(id: number): Promise<Product> {
    const product = await this.productsRepository.findById(id);

    if (!product) {
      throw new AppException('Product not found', {
        code: 'PRODUCT_NOT_FOUND',
        status: 404,
      });
    }

    return product;
  }

  async createProduct(dto: CreateProductDto): Promise<Product> {
    return await this.productsRepository.create(dto);
  }

  async updateProduct(id: number, dto: UpdateProductDto): Promise<Product> {
    const updatedProduct = await this.productsRepository.update(id, dto);

    if (!updatedProduct) {
      throw new AppException('Product not found', {
        code: 'PRODUCT_NOT_FOUND',
        status: 404,
      });
    }

    return updatedProduct;
  }

  async deleteProduct(id: number): Promise<void> {
    const product = await this.productsRepository.findById(id);
    if (!product) {
      throw new AppException('Product not found', {
        code: 'PRODUCT_NOT_FOUND',
        status: 404,
      });
    }

    await this.productsRepository.delete(id);
  }
}
