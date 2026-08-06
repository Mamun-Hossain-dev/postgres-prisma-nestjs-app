import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import type { PaginatedResult } from '../../../common/interfaces/pagination.interface';
import { toRepositoryPagination } from '../../../common/utils/pagination.util';
import { PrismaService } from '../../../infrastructure/prisma/prisma.service';
import type {
  RefundableOrder,
  RefundRequestListQuery,
  RefundRequestView,
} from '../interfaces/refund-request.interface';
import type { RefundRequestRepository } from './refund-request.repository';

const refundRequestInclude = {
  order: {
    select: {
      id: true,
      orderNumber: true,
      status: true,
      totalAmount: true,
      currency: true,
      customerName: true,
      customerEmail: true,
      paymentMethod: true,
    },
  },
  refund: {
    select: {
      id: true,
      amount: true,
      currency: true,
      status: true,
    },
  },
} as const;

@Injectable()
export class PrismaRefundRequestRepository implements RefundRequestRepository {
  constructor(private readonly prisma: PrismaService) {}

  create(
    userId: number,
    orderId: number,
    reason: string,
  ): Promise<RefundRequestView> {
    return this.prisma.refundRequest.create({
      data: { userId, orderId, reason },
      include: refundRequestInclude,
    });
  }

  findById(requestId: number): Promise<RefundRequestView | null> {
    return this.prisma.refundRequest.findUnique({
      where: { id: requestId },
      include: refundRequestInclude,
    });
  }

  findOwnedById(
    userId: number,
    requestId: number,
  ): Promise<RefundRequestView | null> {
    return this.prisma.refundRequest.findFirst({
      where: { id: requestId, userId },
      include: refundRequestInclude,
    });
  }

  findActiveForOrder(orderId: number): Promise<RefundRequestView | null> {
    return this.prisma.refundRequest.findFirst({
      where: { orderId, status: { in: ['PENDING', 'APPROVED'] } },
      orderBy: { createdAt: 'desc' },
      include: refundRequestInclude,
    });
  }

  async findRefundableOrder(
    userId: number,
    orderId: number,
  ): Promise<RefundableOrder | null> {
    const order = await this.prisma.order.findFirst({
      where: { id: orderId, userId },
      select: {
        id: true,
        orderNumber: true,
        status: true,
        payments: {
          where: { status: 'SUCCEEDED' },
          orderBy: { createdAt: 'desc' },
          take: 1,
          select: { id: true, status: true, providerIntentId: true },
        },
      },
    });
    if (!order) return null;
    const payment = order.payments[0];
    return {
      orderId: order.id,
      orderNumber: order.orderNumber,
      orderStatus: order.status,
      paymentId: payment?.id ?? null,
      paymentStatus: payment?.status ?? null,
      refundable: Boolean(payment?.providerIntentId),
    };
  }

  async findAllForUser(
    userId: number,
    query: RefundRequestListQuery,
  ): Promise<PaginatedResult<RefundRequestView>> {
    return this.findMany({
      where: {
        userId,
        ...this.buildStatusWhere(query),
        ...(query.orderId ? { orderId: query.orderId } : {}),
      },
      query,
    });
  }

  async findAllForAdmin(
    query: RefundRequestListQuery,
  ): Promise<PaginatedResult<RefundRequestView>> {
    return this.findMany({
      where: {
        ...this.buildStatusWhere(query),
        ...(query.orderId ? { orderId: query.orderId } : {}),
      },
      query,
    });
  }

  async approve(
    requestId: number,
    adminId: number,
    refundId: number,
    note: string | null,
  ): Promise<RefundRequestView | null> {
    return this.decide(requestId, {
      status: 'APPROVED',
      adminId,
      refundId,
      decisionNote: note,
      reviewedAt: new Date(),
    });
  }

  async deny(
    requestId: number,
    adminId: number,
    note: string | null,
  ): Promise<RefundRequestView | null> {
    return this.decide(requestId, {
      status: 'DENIED',
      adminId,
      decisionNote: note,
      reviewedAt: new Date(),
    });
  }

  private buildStatusWhere(
    query: RefundRequestListQuery,
  ): Prisma.RefundRequestWhereInput {
    return query.status ? { status: query.status } : {};
  }

  private async findMany({
    where,
    query,
  }: {
    where: Prisma.RefundRequestWhereInput;
    query: RefundRequestListQuery;
  }): Promise<PaginatedResult<RefundRequestView>> {
    const pagination = toRepositoryPagination(query);
    const [data, totalItems] = await this.prisma.$transaction([
      this.prisma.refundRequest.findMany({
        where,
        ...pagination,
        orderBy: { createdAt: 'desc' },
        include: refundRequestInclude,
      }),
      this.prisma.refundRequest.count({ where }),
    ]);
    return {
      data,
      meta: {
        page: query.page,
        limit: query.limit,
        totalItems,
        totalPages: Math.ceil(totalItems / query.limit),
        hasNextPage: query.page * query.limit < totalItems,
        hasPreviousPage: query.page > 1,
      },
    };
  }

  private async decide(
    requestId: number,
    data: {
      status: 'APPROVED' | 'DENIED';
      adminId: number;
      refundId?: number;
      decisionNote: string | null;
      reviewedAt: Date;
    },
  ): Promise<RefundRequestView | null> {
    const result = await this.prisma.refundRequest.updateMany({
      where: { id: requestId, status: 'PENDING' },
      data: {
        status: data.status,
        adminId: data.adminId,
        decisionNote: data.decisionNote,
        reviewedAt: data.reviewedAt,
        ...(data.refundId !== undefined ? { refundId: data.refundId } : {}),
      },
    });
    if (!result.count) return null;
    return this.findById(requestId);
  }
}
