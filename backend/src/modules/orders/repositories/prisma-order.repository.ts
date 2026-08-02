import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../infrastructure/prisma/prisma.service';
import type { PaginationOptions } from '../../../common/interfaces/pagination.interface';
import type {
  OrderView,
  PaymentSucceededEvent,
} from '../../payments/interfaces/payment.interface';
import type { OrderRepository } from './order.repository';
import { toRepositoryPagination } from '../../../common/utils/pagination.util';

const orderInclude = {
  items: { orderBy: { id: 'asc' as const } },
};

@Injectable()
export class PrismaOrderRepository implements OrderRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findAllByUser(userId: number, options: PaginationOptions) {
    const pagination = toRepositoryPagination(options);
    const [data, totalItems] = await this.prisma.$transaction([
      this.prisma.order.findMany({
        where: { userId },
        ...pagination,
        orderBy: { createdAt: 'desc' },
        include: orderInclude,
      }),
      this.prisma.order.count({ where: { userId } }),
    ]);
    return {
      data,
      meta: {
        page: options.page,
        limit: options.limit,
        totalItems,
        totalPages: Math.ceil(totalItems / options.limit),
        hasNextPage: options.page * options.limit < totalItems,
        hasPreviousPage: options.page > 1,
      },
    };
  }

  findById(userId: number, orderId: number): Promise<OrderView | null> {
    return this.prisma.order.findFirst({
      where: { id: orderId, userId },
      include: orderInclude,
    });
  }

  async findAll(options: PaginationOptions) {
    const pagination = toRepositoryPagination(options);
    const [data, totalItems] = await this.prisma.$transaction([
      this.prisma.order.findMany({
        ...pagination,
        orderBy: { createdAt: 'desc' },
        include: orderInclude,
      }),
      this.prisma.order.count(),
    ]);
    return {
      data,
      meta: {
        page: options.page,
        limit: options.limit,
        totalItems,
        totalPages: Math.ceil(totalItems / options.limit),
        hasNextPage: options.page * options.limit < totalItems,
        hasPreviousPage: options.page > 1,
      },
    };
  }

  findByIdForAdmin(orderId: number): Promise<OrderView | null> {
    return this.prisma.order.findUnique({
      where: { id: orderId },
      include: orderInclude,
    });
  }

  async deleteRemovable(orderId: number): Promise<boolean> {
    return this.prisma.$transaction(async (prisma) => {
      const order = await prisma.order.findUnique({
        where: { id: orderId },
        select: {
          status: true,
          couponRedemption: {
            select: { couponId: true, status: true },
          },
        },
      });
      if (
        !order ||
        (order.status !== 'PAYMENT_PENDING' && order.status !== 'CANCELLED')
      ) {
        return false;
      }

      if (order.couponRedemption?.status === 'RESERVED') {
        await prisma.coupon.updateMany({
          where: {
            id: order.couponRedemption.couponId,
            remainingUses: { not: null },
          },
          data: { remainingUses: { increment: 1 } },
        });
      }
      await prisma.payment.deleteMany({ where: { orderId } });
      await prisma.order.delete({ where: { id: orderId } });
      return true;
    });
  }

  async getInvoiceData(
    userId: number,
    orderId: number,
  ): Promise<PaymentSucceededEvent | null> {
    return this.findInvoiceData({ id: orderId, userId });
  }

  async getInvoiceDataForAdmin(
    orderId: number,
  ): Promise<PaymentSucceededEvent | null> {
    return this.findInvoiceData({ id: orderId });
  }

  private async findInvoiceData(where: {
    id: number;
    userId?: number;
  }): Promise<PaymentSucceededEvent | null> {
    const order = await this.prisma.order.findFirst({
      where: { ...where, status: 'PAID' },
      include: {
        items: { orderBy: { id: 'asc' } },
        payments: {
          where: { status: 'SUCCEEDED' },
          orderBy: { paidAt: 'desc' },
          take: 1,
        },
      },
    });
    const payment = order?.payments[0];
    if (!order || !payment?.paidAt) return null;

    return {
      eventId: `invoice-${payment.id}`,
      orderId: order.id,
      orderNumber: order.orderNumber,
      paymentId: payment.id,
      customer: {
        id: order.userId,
        name: order.customerName,
        email: order.customerEmail,
      },
      items: order.items.map((item) => ({
        productTitle: item.productTitle,
        productSku: item.productSku,
        unitAmount: item.unitAmount,
        quantity: item.quantity,
        totalAmount: item.totalAmount,
      })),
      totalAmount: order.totalAmount,
      orderTotal: order.totalAmount,
      subtotalAmount: order.subtotalAmount,
      discountAmount: order.discountAmount,
      deliveryCharge: order.deliveryCharge,
      dueOnDelivery: 0,
      paymentMethod: order.paymentMethod,
      deliveryZone: order.deliveryZone,
      currency: order.currency,
      paymentStatus: 'SUCCEEDED',
      paymentDate: payment.paidAt.toISOString(),
    };
  }
}
