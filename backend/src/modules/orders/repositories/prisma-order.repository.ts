import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../../infrastructure/prisma/prisma.service';
import type { PaginationOptions } from '../../../common/interfaces/pagination.interface';
import type {
  OrderView,
  PaymentSucceededEvent,
} from '../../payments/interfaces/payment.interface';
import type { OrderRepository } from './order.repository';
import type { AdminOrderQueryDto } from '../dto/admin-order-query.dto';
import { toRepositoryPagination } from '../../../common/utils/pagination.util';
import { getDueOnDelivery } from '../../payments/utils/checkout-amount.util';

const orderInclude = {
  items: { orderBy: { id: 'asc' as const } },
  payments: {
    orderBy: { createdAt: 'desc' as const },
    take: 1,
    select: { id: true, amount: true, status: true },
  },
};

const adminOrderInclude = {
  ...orderInclude,
  refundRequests: {
    orderBy: { createdAt: 'desc' as const },
    take: 5,
    select: {
      id: true,
      reason: true,
      status: true,
      decisionNote: true,
      reviewedAt: true,
      createdAt: true,
      refund: {
        select: { id: true, amount: true, status: true },
      },
    },
  },
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

  async findAll(options: AdminOrderQueryDto) {
    const pagination = toRepositoryPagination(options);
    const where = this.buildAdminWhere(options);
    const [data, totalItems] = await this.prisma.$transaction([
      this.prisma.order.findMany({
        where,
        ...pagination,
        orderBy: { createdAt: 'desc' },
        include: orderInclude,
      }),
      this.prisma.order.count({ where }),
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

  private buildAdminWhere(
    options: AdminOrderQueryDto,
  ): Prisma.OrderWhereInput | undefined {
    const where: Prisma.OrderWhereInput = {};
    if (options.status) where.status = options.status;
    const search = options.search?.trim();
    if (search) {
      where.OR = [
        { orderNumber: { contains: search, mode: 'insensitive' } },
        { customerName: { contains: search, mode: 'insensitive' } },
        { customerEmail: { contains: search, mode: 'insensitive' } },
        { customerPhone: { contains: search, mode: 'insensitive' } },
      ];
    }
    return Object.keys(where).length > 0 ? where : undefined;
  }

  findByIdForAdmin(orderId: number): Promise<OrderView | null> {
    return this.prisma.order.findUnique({
      where: { id: orderId },
      include: adminOrderInclude,
    });
  }

  async updateStatus(
    orderId: number,
    status: OrderView['status'],
  ): Promise<OrderView> {
    return this.prisma.$transaction(async (prisma) => {
      const current = await prisma.order.findUniqueOrThrow({
        where: { id: orderId },
        select: { paidAt: true },
      });
      return prisma.order.update({
        where: { id: orderId },
        data: {
          status,
          ...(status === 'DELIVERED' && !current.paidAt
            ? { paidAt: new Date() }
            : {}),
        },
        include: orderInclude,
      });
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
      where: {
        ...where,
        status: {
          in: ['PAID', 'COD_CONFIRMED', 'PROCESSING', 'SHIPPED', 'DELIVERED'],
        },
      },
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
        phone: order.customerPhone,
        addressLine: order.deliveryAddressLine,
        area: order.deliveryArea,
        city: order.deliveryCity,
        postalCode: order.deliveryPostalCode,
      },
      items: order.items.map((item) => ({
        productTitle: item.productTitle,
        productSku: item.productSku,
        unitAmount: item.unitAmount,
        quantity: item.quantity,
        totalAmount: item.totalAmount,
      })),
      totalAmount:
        order.status === 'DELIVERED' ? order.totalAmount : payment.amount,
      orderTotal: order.totalAmount,
      subtotalAmount: order.subtotalAmount,
      discountAmount: order.discountAmount,
      deliveryCharge: order.deliveryCharge,
      dueOnDelivery:
        order.status === 'DELIVERED'
          ? 0
          : getDueOnDelivery(
              order.paymentMethod,
              order.totalAmount,
              payment.amount,
            ),
      paymentMethod: order.paymentMethod,
      deliveryZone: order.deliveryZone,
      currency: order.currency,
      paymentStatus: 'SUCCEEDED',
      paymentDate: payment.paidAt.toISOString(),
    };
  }
}
