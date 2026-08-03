import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { AppException } from '../../../common/exceptions/app.exception';
import { PrismaService } from '../../../infrastructure/prisma/prisma.service';
import type {
  CreateCouponDto,
  CreateReviewDto,
  InventoryQueryDto,
  ReviewQueryDto,
  UpdateCouponDto,
} from '../dto/operations.dto';
import type { OperationsRepository } from './operations.repository';

@Injectable()
export class PrismaOperationsRepository implements OperationsRepository {
  constructor(private readonly prisma: PrismaService) {}

  async getInventory(query: InventoryQueryDto) {
    const where = {
      ...(query.search?.trim()
        ? {
            OR: ['title', 'sku', 'brand'].map((field) => ({
              [field]: {
                contains: query.search!.trim(),
                mode: 'insensitive' as const,
              },
            })),
          }
        : {}),
      ...(query.stock === 'low'
        ? { quantity: { gt: 0, lt: 5 } }
        : query.stock === 'out'
          ? { quantity: 0 }
          : {}),
    };
    const [data, totalItems] = await this.prisma.$transaction([
      this.prisma.product.findMany({
        where,
        skip: (query.page - 1) * query.limit,
        take: query.limit,
        orderBy: [{ quantity: 'asc' }, { title: 'asc' }],
        include: {
          images: { orderBy: { id: 'asc' }, take: 1 },
          stockMovements: {
            orderBy: { createdAt: 'desc' },
            take: 1,
            include: { adjustedBy: { select: { name: true } } },
          },
        },
      }),
      this.prisma.product.count({ where }),
    ]);
    return {
      data,
      meta: {
        page: query.page,
        limit: query.limit,
        totalItems,
        totalPages: Math.ceil(totalItems / query.limit),
      },
    };
  }

  async createReview(
    userId: number,
    productId: number,
    input: CreateReviewDto,
  ) {
    const [product, purchased] = await Promise.all([
      this.prisma.product.findUnique({
        where: { id: productId },
        select: { id: true },
      }),
      this.prisma.order.count({
        where: {
          userId,
          status: { in: ['PAID', 'COD_CONFIRMED'] },
          items: { some: { productId } },
        },
      }),
    ]);
    if (!product) throw this.notFound('Product');
    if (!purchased) {
      throw new AppException(
        'Only verified customers can review this product',
        {
          code: 'REVIEW_PURCHASE_REQUIRED',
          status: 403,
        },
      );
    }
    try {
      return await this.prisma.review.create({
        data: { ...input, productId, userId, isVerified: true },
        include: {
          user: { select: { name: true } },
          product: { select: { title: true } },
        },
      });
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        throw new AppException('You have already reviewed this product', {
          code: 'REVIEW_ALREADY_EXISTS',
          status: 409,
        });
      }
      throw error;
    }
  }

  getProductReviews(productId: number) {
    return this.prisma.review.findMany({
      where: { productId, status: 'APPROVED' },
      orderBy: { createdAt: 'desc' },
      include: { user: { select: { name: true } } },
    });
  }

  async getReviews(query: ReviewQueryDto) {
    const where = query.status ? { status: query.status } : {};
    const [data, totalItems] = await this.prisma.$transaction([
      this.prisma.review.findMany({
        where,
        skip: (query.page - 1) * query.limit,
        take: query.limit,
        orderBy: { createdAt: 'desc' },
        include: {
          user: { select: { name: true, email: true } },
          product: { select: { id: true, title: true, sku: true } },
        },
      }),
      this.prisma.review.count({ where }),
    ]);
    return {
      data,
      meta: {
        page: query.page,
        limit: query.limit,
        totalItems,
        totalPages: Math.ceil(totalItems / query.limit),
      },
    };
  }

  async moderateReview(id: number, status: 'APPROVED' | 'REJECTED') {
    const result = await this.prisma.review.updateMany({
      where: { id },
      data: { status },
    });
    if (!result.count) throw this.notFound('Review');
    return this.prisma.review.findUnique({ where: { id } });
  }

  getCoupons() {
    return this.prisma.coupon.findMany({ orderBy: { createdAt: 'desc' } });
  }

  getAvailableCoupons() {
    const now = new Date();
    return this.prisma.coupon.findMany({
      where: {
        isActive: true,
        AND: [
          { OR: [{ startsAt: null }, { startsAt: { lte: now } }] },
          { OR: [{ endsAt: null }, { endsAt: { gt: now } }] },
          { OR: [{ remainingUses: null }, { remainingUses: { gt: 0 } }] },
        ],
      },
      select: {
        id: true,
        code: true,
        description: true,
        type: true,
        value: true,
        minimumAmount: true,
        remainingUses: true,
        endsAt: true,
      },
      orderBy: [{ endsAt: 'asc' }, { createdAt: 'desc' }],
      take: 8,
    });
  }

  createCoupon(input: CreateCouponDto) {
    return this.prisma.coupon
      .create({
        data: {
          code: input.code.trim().toUpperCase(),
          description: input.description?.trim(),
          type: input.type,
          value: input.value,
          minimumAmount: input.minimumAmount,
          usageLimit: input.usageLimit,
          remainingUses: input.usageLimit,
          isActive: input.isActive,
          startsAt: input.startsAt ? new Date(input.startsAt) : undefined,
          endsAt: input.endsAt ? new Date(input.endsAt) : undefined,
        },
      })
      .catch((error: unknown) => this.rethrowCouponConflict(error));
  }

  async updateCoupon(id: number, input: UpdateCouponDto) {
    const existing = await this.prisma.coupon.findUnique({ where: { id } });
    if (!existing) throw this.notFound('Coupon');
    if (
      (input.type ?? existing.type) === 'PERCENTAGE' &&
      (input.value ?? existing.value) > 100
    ) {
      throw new AppException('Percentage discount cannot exceed 100', {
        code: 'INVALID_COUPON_VALUE',
        status: 400,
      });
    }
    return this.prisma.coupon
      .update({
        where: { id },
        data: this.couponUpdateData(input, existing.usedCount),
      })
      .catch((error: unknown) => this.rethrowCouponConflict(error));
  }

  async deleteCoupon(id: number) {
    const result = await this.prisma.coupon.deleteMany({
      where: { id, redemptions: { none: {} } },
    });
    if (!result.count) {
      throw new AppException(
        'Used coupons cannot be deleted; deactivate them instead',
        {
          code: 'COUPON_DELETE_CONFLICT',
          status: 409,
        },
      );
    }
  }

  private couponUpdateData(input: UpdateCouponDto, usedCount: number) {
    const usageLimit = input.usageLimit;
    return {
      ...(input.code ? { code: input.code.trim().toUpperCase() } : {}),
      ...(input.description !== undefined
        ? { description: input.description.trim() }
        : {}),
      ...(input.type ? { type: input.type } : {}),
      ...(input.value !== undefined ? { value: input.value } : {}),
      ...(input.minimumAmount !== undefined
        ? { minimumAmount: input.minimumAmount }
        : {}),
      ...(usageLimit !== undefined
        ? { usageLimit, remainingUses: Math.max(0, usageLimit - usedCount) }
        : {}),
      ...(input.isActive !== undefined ? { isActive: input.isActive } : {}),
      ...(input.startsAt ? { startsAt: new Date(input.startsAt) } : {}),
      ...(input.endsAt ? { endsAt: new Date(input.endsAt) } : {}),
    };
  }

  private notFound(resource: string) {
    return new AppException(`${resource} not found`, {
      code: `${resource.toUpperCase()}_NOT_FOUND`,
      status: 404,
    });
  }

  private rethrowCouponConflict(error: unknown): never {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === 'P2002'
    ) {
      throw new AppException('Coupon code already exists', {
        code: 'COUPON_CODE_EXISTS',
        status: 409,
      });
    }
    throw error;
  }
}
