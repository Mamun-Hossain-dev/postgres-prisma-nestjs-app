import { Injectable } from '@nestjs/common';
import { CreateProductDto } from '../dto/create-product.dto';
import { UpdateProductDto } from '../dto/update-product.dto';
import { Product } from '../interfaces/product.interface';
import { ProductRepository } from './product.repository';

@Injectable()
export class InMemoryProductRepository extends ProductRepository {
  private products: Product[] = [
    {
      id: 1,
      title: 'iPhone 15',
      price: 1200,
      quantity: 10,
    },
    {
      id: 2,
      title: 'MacBook Pro',
      price: 2200,
      quantity: 5,
    },
  ];

  findAll(): Promise<Product[]> {
    return Promise.resolve(this.products);
  }

  findById(id: number): Promise<Product | null> {
    return Promise.resolve(
      this.products.find((product) => product.id === id) ?? null,
    );
  }

  create(dto: CreateProductDto): Promise<Product> {
    const nextId =
      this.products.length > 0
        ? Math.max(...this.products.map((product) => product.id)) + 1
        : 1;

    const newProduct: Product = {
      id: nextId,
      ...dto,
    };

    this.products.push(newProduct);
    return Promise.resolve(newProduct);
  }

  update(id: number, dto: UpdateProductDto): Promise<Product | null> {
    const productIndex = this.products.findIndex(
      (product) => product.id === id,
    );

    if (productIndex === -1) {
      return Promise.resolve(null);
    }

    this.products[productIndex] = { ...this.products[productIndex], ...dto };
    return Promise.resolve(this.products[productIndex]);
  }

  delete(id: number): Promise<void> {
    const productIndex = this.products.findIndex(
      (product) => product.id === id,
    );

    if (productIndex >= 0) {
      this.products.splice(productIndex, 1);
    }

    return Promise.resolve();
  }
}
