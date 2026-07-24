import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../infrastructure/prisma/prisma.service';
import {
  CreateProductInput,
  NewProductImage,
  Product,
  ProductImage,
  UpdateProductInput,
  ProductListOptions,
} from '../interfaces/product.interface';
import type { ProductRepository } from './product.repository';
import type { RepositoryPaginatedResult } from '../../../common/interfaces/pagination.interface';

@Injectable()
export class PrismaProductRepository implements ProductRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(
    options: ProductListOptions,
  ): Promise<RepositoryPaginatedResult<Product>> {
    const where = {
      ...(options.search
        ? {
            OR: [
              {
                title: {
                  contains: options.search,
                  mode: 'insensitive' as const,
                },
              },
              {
                brand: {
                  contains: options.search,
                  mode: 'insensitive' as const,
                },
              },
              {
                description: {
                  contains: options.search,
                  mode: 'insensitive' as const,
                },
              },
            ],
          }
        : {}),
      ...(options.category ? { category: options.category } : {}),
      ...(options.brand
        ? { brand: { equals: options.brand, mode: 'insensitive' as const } }
        : {}),
      ...(options.featured === undefined
        ? {}
        : { isFeatured: options.featured }),
      ...(options.minPrice !== undefined || options.maxPrice !== undefined
        ? {
            price: {
              ...(options.minPrice !== undefined
                ? { gte: options.minPrice }
                : {}),
              ...(options.maxPrice !== undefined
                ? { lte: options.maxPrice }
                : {}),
            },
          }
        : {}),
    };
    const orderBy =
      options.sort === 'price-asc'
        ? { price: 'asc' as const }
        : options.sort === 'price-desc'
          ? { price: 'desc' as const }
          : options.sort === 'name-asc'
            ? { title: 'asc' as const }
            : { createdAt: 'desc' as const };

    const [data, totalItems] = await this.prisma.$transaction([
      this.prisma.product.findMany({
        skip: options.skip,
        take: options.take,
        where,
        orderBy,
        include: { images: { orderBy: { id: 'asc' } } },
      }),
      this.prisma.product.count({ where }),
    ]);

    return { data, totalItems };
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
