import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../infrastructure/prisma/prisma.service';
import {
  CreateProductInput,
  NewProductImage,
  Product,
  ProductImage,
  UpdateProductInput,
  ProductListOptions,
  ProductCollections,
  CatalogOperationsSummary,
  StockAdjustment,
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
                sku: {
                  contains: options.search,
                  mode: 'insensitive' as const,
                },
              },
              {
                shortDescription: {
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
      ...(options.status ? { status: options.status } : {}),
      ...(options.publishedBefore
        ? { publishedAt: { lte: options.publishedBefore } }
        : {}),
      ...(options.onSale
        ? {
            compareAtPrice: { not: null },
            AND: [
              {
                OR: [
                  { offerStartsAt: null },
                  { offerStartsAt: { lte: new Date() } },
                ],
              },
              {
                OR: [
                  { offerEndsAt: null },
                  { offerEndsAt: { gte: new Date() } },
                ],
              },
            ],
          }
        : {}),
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

  async findCollections(limit: number): Promise<ProductCollections> {
    const now = new Date();
    const include = { images: { orderBy: { id: 'asc' as const } } };
    const active = {
      status: 'ACTIVE' as const,
      publishedAt: { lte: now },
    };
    const offerWindow = {
      ...active,
      compareAtPrice: { not: null },
      AND: [
        {
          OR: [{ offerStartsAt: null }, { offerStartsAt: { lte: now } }],
        },
        {
          OR: [{ offerEndsAt: null }, { offerEndsAt: { gte: now } }],
        },
      ],
    };

    const [featured, newArrivals, offers, bestSellers, trending, brands] =
      await this.prisma.$transaction([
        this.prisma.product.findMany({
          where: { ...active, isFeatured: true },
          take: limit,
          orderBy: { publishedAt: 'desc' },
          include,
        }),
        this.prisma.product.findMany({
          where: active,
          take: limit,
          orderBy: { publishedAt: 'desc' },
          include,
        }),
        this.prisma.product.findMany({
          where: offerWindow,
          take: limit,
          orderBy: { publishedAt: 'desc' },
          include,
        }),
        this.prisma.product.findMany({
          where: { ...active, isBestSeller: true },
          take: limit,
          orderBy: { publishedAt: 'desc' },
          include,
        }),
        this.prisma.product.findMany({
          where: { ...active, isTrending: true },
          take: limit,
          orderBy: { publishedAt: 'desc' },
          include,
        }),
        this.prisma.product.findMany({
          where: active,
          distinct: ['brand'],
          orderBy: { brand: 'asc' },
          select: { brand: true },
        }),
      ]);

    return {
      featured,
      newArrivals,
      offers: offers.filter(
        (product) =>
          product.compareAtPrice !== null &&
          product.compareAtPrice > product.price,
      ),
      bestSellers,
      trending,
      brands: brands.map(({ brand }) => brand),
    };
  }

  async getOperationsSummary(): Promise<CatalogOperationsSummary> {
    const [categoryGroups, brandGroups, products] = await Promise.all([
      this.prisma.product.groupBy({
        by: ['category'],
        _count: { _all: true },
        _sum: { quantity: true },
        orderBy: { category: 'asc' },
      }),
      this.prisma.product.groupBy({
        by: ['brand'],
        _count: { _all: true },
        _sum: { quantity: true },
        orderBy: { brand: 'asc' },
      }),
      this.prisma.product.findMany({ select: { quantity: true } }),
    ]);
    return {
      categories: categoryGroups.map((group) => ({
        category: group.category,
        productCount: group._count._all,
        stockCount: group._sum.quantity ?? 0,
      })),
      brands: brandGroups.map((group) => ({
        brand: group.brand,
        productCount: group._count._all,
        stockCount: group._sum.quantity ?? 0,
      })),
      inventory: {
        totalProducts: products.length,
        totalUnits: products.reduce(
          (sum, product) => sum + product.quantity,
          0,
        ),
        lowStockProducts: products.filter(
          (product) => product.quantity > 0 && product.quantity < 5,
        ).length,
        outOfStockProducts: products.filter((product) => product.quantity === 0)
          .length,
      },
    };
  }

  async adjustStock(
    id: number,
    quantity: number,
    adjustedById: number,
    reason: string,
  ): Promise<StockAdjustment | null> {
    return this.prisma.$transaction(async (prisma) => {
      const existing = await prisma.product.findUnique({ where: { id } });
      if (!existing) return null;
      const product = await prisma.product.update({
        where: { id },
        data: { quantity },
        include: { images: { orderBy: { id: 'asc' } } },
      });
      const movement = await prisma.stockMovement.create({
        data: {
          productId: id,
          adjustedById,
          previousStock: existing.quantity,
          newStock: quantity,
          change: quantity - existing.quantity,
          reason,
        },
      });
      return { product, movement };
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
