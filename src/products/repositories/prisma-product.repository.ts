import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import {
  CreateProductInput,
  NewProductImage,
  Product,
  ProductImage,
  UpdateProductInput,
} from '../interfaces/product.interface';
import type { ProductRepository } from './product.repository';

@Injectable()
export class PrismaProductRepository implements ProductRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(): Promise<Product[]> {
    return await this.prisma.product.findMany({
      orderBy: { id: 'asc' },
      include: { images: { orderBy: { id: 'asc' } } },
    });
  }

  async findById(id: number): Promise<Product | null> {
    return await this.prisma.product.findUnique({
      where: { id },
      include: { images: { orderBy: { id: 'asc' } } },
    });
  }

  async create(
    input: CreateProductInput,
    images: NewProductImage[] = [],
  ): Promise<Product> {
    return await this.prisma.product.create({
      data: {
        ...input,
        images: { create: images },
      },
      include: { images: true },
    });
  }

  async update(
    id: number,
    input: UpdateProductInput,
    images: NewProductImage[] = [],
  ): Promise<Product | null> {
    const existingProduct = await this.prisma.product.findUnique({
      where: { id },
    });

    if (!existingProduct) {
      return null;
    }

    return await this.prisma.product.update({
      where: { id },
      data: {
        ...input,
        images: images.length ? { create: images } : undefined,
      },
      include: { images: { orderBy: { id: 'asc' } } },
    });
  }

  async addImages(
    id: number,
    images: NewProductImage[],
  ): Promise<Product | null> {
    const existingProduct = await this.prisma.product.findUnique({
      where: { id },
    });

    if (!existingProduct) return null;

    await this.prisma.productImage.createMany({
      data: images.map((image) => ({ ...image, productId: id })),
    });

    return this.findById(id);
  }

  async findImage(
    productId: number,
    imageId: number,
  ): Promise<ProductImage | null> {
    return this.prisma.productImage.findFirst({
      where: { id: imageId, productId },
    });
  }

  async deleteImage(productId: number, imageId: number): Promise<void> {
    await this.prisma.productImage.deleteMany({
      where: { id: imageId, productId },
    });
  }

  async delete(id: number): Promise<void> {
    await this.prisma.product.delete({
      where: { id },
    });
  }
}
