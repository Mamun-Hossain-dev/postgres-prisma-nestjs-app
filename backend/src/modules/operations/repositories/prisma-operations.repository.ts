import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { AppException } from '../../../common/exceptions/app.exception';
import { PrismaService } from '../../../infrastructure/prisma/prisma.service';
import type { PaginationQueryDto } from '../../../common/dto/pagination-query.dto';
import type { OrderStatus } from '../../payments/interfaces/payment.interface';
import type { AnalyticsOverview } from '../interfaces/analytics.interface';
import type {
  CreateCouponDto,
  CreateReviewDto,
  InventoryQueryDto,
  ReviewQueryDto,
  UpdateCouponDto,
} from '../dto/operations.dto';
import type { OperationsRepository } from './operations.repository';

const CONFIRMED_ORDER_STATUSES: OrderStatus[] = [
  'PAID',
  'COD_CONFIRMED',
  'PROCESSING',
  'SHIPPED',
  'DELIVERED',
];

const ALL_ORDER_STATUSES: OrderStatus[] = [
  'PAYMENT_PENDING',
  'PAYMENT_PROCESSING',
  'PAID',
  'COD_CONFIRMED',
  'PROCESSING',
  'SHIPPED',
  'DELIVERED',
  'PAYMENT_FAILED',
  'CANCELLED',
];

const DAY_MS = 24 * 60 * 60 * 1000;

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

  async getProductMovements(productId: number, query: PaginationQueryDto) {
    const product = await this.prisma.product.findUnique({
      where: { id: productId },
      select: { id: true },
    });
    if (!product) throw this.notFound('Product');

    const [data, totalItems] = await this.prisma.$transaction([
      this.prisma.stockMovement.findMany({
        where: { productId },
        skip: (query.page - 1) * query.limit,
        take: query.limit,
        orderBy: { createdAt: 'desc' },
        include: { adjustedBy: { select: { name: true } } },
      }),
      this.prisma.stockMovement.count({ where: { productId } }),
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

  async getAnalytics(): Promise<AnalyticsOverview> {
    const now = new Date();
    const startOfToday = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate(),
    );
    const startOf30Days = new Date(startOfToday.getTime() - 30 * DAY_MS);
    const startOfTrend = new Date(startOfToday.getTime() - 13 * DAY_MS);

    const [
      ordersTotal,
      ordersLast30,
      statusGroups,
      pendingFulfilment,
      revenueTotal,
      revenue30,
      revenueToday,
      confirmedOrders,
      customersTotal,
      newCustomers,
      trendOrders,
      topProducts,
      paymentSplit,
    ] = await Promise.all([
      this.prisma.order.count(),
      this.prisma.order.count({
        where: { createdAt: { gte: startOf30Days } },
      }),
      this.prisma.order.groupBy({
        by: ['status'],
        _count: { _all: true },
      }),
      this.prisma.order.count({
        where: {
          status: { in: ['PAID', 'COD_CONFIRMED', 'PROCESSING', 'SHIPPED'] },
        },
      }),
      this.prisma.order.aggregate({
        where: { status: { in: CONFIRMED_ORDER_STATUSES } },
        _sum: { totalAmount: true },
      }),
      this.prisma.order.aggregate({
        where: {
          status: { in: CONFIRMED_ORDER_STATUSES },
          createdAt: { gte: startOf30Days },
        },
        _sum: { totalAmount: true },
      }),
      this.prisma.order.aggregate({
        where: {
          status: { in: CONFIRMED_ORDER_STATUSES },
          createdAt: { gte: startOfToday },
        },
        _sum: { totalAmount: true },
      }),
      this.prisma.order.count({
        where: { status: { in: CONFIRMED_ORDER_STATUSES } },
      }),
      this.prisma.user.count(),
      this.prisma.user.count({ where: { createdAt: { gte: startOf30Days } } }),
      this.prisma.order.findMany({
        where: {
          status: { in: CONFIRMED_ORDER_STATUSES },
          createdAt: { gte: startOfTrend },
        },
        select: { totalAmount: true, createdAt: true },
      }),
      this.prisma.orderItem.groupBy({
        by: ['productId', 'productTitle', 'productSku'],
        where: { order: { status: { in: CONFIRMED_ORDER_STATUSES } } },
        _sum: { quantity: true, totalAmount: true },
        orderBy: { _sum: { quantity: 'desc' } },
        take: 5,
      }),
      this.prisma.order.groupBy({
        by: ['paymentMethod'],
        where: { status: { in: CONFIRMED_ORDER_STATUSES } },
        _count: { _all: true },
        _sum: { totalAmount: true },
      }),
    ]);

    const totalRevenue = revenueTotal._sum.totalAmount ?? 0;
    const byStatus = Object.fromEntries(
      ALL_ORDER_STATUSES.map((status) => [status, 0]),
    ) as Record<OrderStatus, number>;
    for (const group of statusGroups)
      byStatus[group.status] = group._count._all;

    const trendByDate = new Map<string, { revenue: number; orders: number }>();
    for (let offset = 13; offset >= 0; offset--) {
      const day = new Date(startOfToday.getTime() - offset * DAY_MS);
      trendByDate.set(this.toDateKey(day), { revenue: 0, orders: 0 });
    }
    for (const order of trendOrders) {
      const bucket = trendByDate.get(this.toDateKey(order.createdAt));
      if (!bucket) continue;
      bucket.revenue += order.totalAmount;
      bucket.orders += 1;
    }

    const split: AnalyticsOverview['paymentSplit'] = {
      CARD: { count: 0, amount: 0 },
      CASH_ON_DELIVERY: { count: 0, amount: 0 },
    };
    for (const group of paymentSplit) {
      split[group.paymentMethod] = {
        count: group._count._all,
        amount: group._sum.totalAmount ?? 0,
      };
    }

    return {
      revenue: {
        total: totalRevenue,
        today: revenueToday._sum.totalAmount ?? 0,
        last30Days: revenue30._sum.totalAmount ?? 0,
        averageOrderValue: confirmedOrders
          ? Math.round(totalRevenue / confirmedOrders)
          : 0,
      },
      orders: {
        total: ordersTotal,
        last30Days: ordersLast30,
        pendingFulfilment,
        byStatus,
      },
      customers: {
        total: customersTotal,
        newLast30Days: newCustomers,
      },
      salesTrend: Array.from(trendByDate, ([date, value]) => ({
        date,
        ...value,
      })),
      topProducts: topProducts.map((product) => ({
        productId: product.productId,
        title: product.productTitle,
        sku: product.productSku,
        unitsSold: product._sum.quantity ?? 0,
        revenue: product._sum.totalAmount ?? 0,
      })),
      paymentSplit: split,
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

  private toDateKey(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
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
