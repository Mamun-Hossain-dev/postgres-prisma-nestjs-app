import { Injectable, Logger } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { toRepositoryPagination } from '../../../../common/utils/pagination.util';
import type { PaginatedResult } from '../../../../common/interfaces/pagination.interface';
import { PrismaService } from '../../../../infrastructure/prisma/prisma.service';
import type { PaymentView } from '../../interfaces/payment.interface';
import type {
  CreateRefundInput,
  RefundCompletedEvent,
  RefundListQuery,
  RefundView,
  RefundWebhookProcessingResult,
  VerifiedRefundEvent,
} from '../interfaces/refund.interface';
import type { RefundRepository } from './refund.repository';

const refundInclude = {
  payment: {
    include: {
      order: {
        select: {
          id: true,
          orderNumber: true,
          userId: true,
          customerName: true,
          customerEmail: true,
          paymentMethod: true,
          totalAmount: true,
          status: true,
        },
      },
    },
  },
} as const;

@Injectable()
export class PrismaRefundRepository implements RefundRepository {
  private readonly logger = new Logger(PrismaRefundRepository.name);

  constructor(private readonly prisma: PrismaService) {}

  findById(id: number): Promise<RefundView | null> {
    return this.prisma.refund.findUnique({
      where: { id },
      include: refundInclude,
    });
  }

  findByIdempotencyKey(idempotencyKey: string): Promise<RefundView | null> {
    return this.prisma.refund.findUnique({
      where: { idempotencyKey },
      include: refundInclude,
    });
  }

  findAllByPaymentId(paymentId: number): Promise<RefundView[]> {
    return this.prisma.refund.findMany({
      where: { paymentId },
      orderBy: { createdAt: 'asc' },
      include: refundInclude,
    });
  }

  async findAll(query: RefundListQuery): Promise<PaginatedResult<RefundView>> {
    const pagination = toRepositoryPagination(query);
    const where: Prisma.RefundWhereInput = {
      ...(query.status ? { status: query.status } : {}),
      ...(query.paymentId ? { paymentId: query.paymentId } : {}),
    };
    const [data, totalItems] = await this.prisma.$transaction([
      this.prisma.refund.findMany({
        where,
        ...pagination,
        orderBy: { createdAt: 'desc' },
        include: refundInclude,
      }),
      this.prisma.refund.count({ where }),
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

  createForPayment(
    payment: PaymentView,
    input: CreateRefundInput,
  ): Promise<RefundView> {
    return this.prisma.refund.create({
      data: {
        paymentId: payment.id,
        providerRefundId: input.providerRefundId,
        amount: input.amount,
        currency: payment.currency,
        reason: input.reason,
        requestedById: input.requestedById,
        idempotencyKey: input.idempotencyKey,
      },
      include: refundInclude,
    });
  }

  async processRefundWebhook(
    event: VerifiedRefundEvent,
  ): Promise<RefundWebhookProcessingResult> {
    try {
      return await this.prisma.$transaction(async (prisma) => {
        await prisma.paymentWebhookEvent.create({
          data: {
            provider: 'STRIPE',
            eventId: event.id,
            eventType: event.type,
          },
        });
        if (!event.refundId || !event.refundStatus) {
          return { duplicate: false };
        }

        const refund = await prisma.refund.findUnique({
          where: { providerRefundId: event.refundId },
          include: refundInclude,
        });
        if (!refund) {
          this.logger.debug(
            `Ignoring refund webhook without a matching refund record: ${event.refundId}`,
          );
          return { duplicate: false };
        }

        if (refund.status === event.refundStatus) {
          return {
            duplicate: false,
            completedEvent:
              event.refundStatus === 'SUCCEEDED'
                ? this.toCompletedEvent(refund, event.id)
                : undefined,
          };
        }

        if (event.refundStatus === 'PENDING') {
          return { duplicate: false };
        }

        const completedAt =
          event.refundStatus === 'SUCCEEDED' ? new Date() : null;
        const updated = await prisma.refund.update({
          where: { id: refund.id },
          data: {
            status: event.refundStatus,
            completedAt,
            failureCode:
              event.refundStatus === 'FAILED'
                ? (event.failureCode ?? 'REFUND_FAILED')
                : null,
            failureMessage:
              event.refundStatus === 'FAILED'
                ? (event.failureMessage ?? 'The refund failed')
                : null,
          },
          include: refundInclude,
        });

        if (event.refundStatus === 'SUCCEEDED') {
          await this.maybeMarkPaymentRefunded(prisma, refund.paymentId);
          return {
            duplicate: false,
            completedEvent: this.toCompletedEvent(updated, event.id),
          };
        }
        return { duplicate: false };
      });
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        const processed = await this.prisma.paymentWebhookEvent.findUnique({
          where: { eventId: event.id },
        });
        if (!processed) throw error;
        if (event.refundId) {
          const refund = await this.prisma.refund.findUnique({
            where: { providerRefundId: event.refundId },
            include: refundInclude,
          });
          if (refund?.status === 'SUCCEEDED') {
            return {
              duplicate: true,
              completedEvent: this.toCompletedEvent(refund, event.id),
            };
          }
        }
        return { duplicate: true };
      }
      throw error;
    }
  }

  private async maybeMarkPaymentRefunded(
    prisma: Prisma.TransactionClient,
    paymentId: number,
  ): Promise<void> {
    const payment = await prisma.payment.findUnique({
      where: { id: paymentId },
      include: {
        refunds: { select: { status: true, amount: true } },
      },
    });
    if (!payment) return;

    const refunded = payment.refunds
      .filter((refund) => refund.status === 'SUCCEEDED')
      .reduce((sum, refund) => sum + refund.amount, 0);
    if (refunded < payment.amount || payment.status === 'REFUNDED') return;

    await prisma.payment.update({
      where: { id: paymentId },
      data: { status: 'REFUNDED', refundedAt: new Date() },
    });
    await prisma.order.update({
      where: { id: payment.orderId },
      data: { status: 'CANCELLED' },
    });
    await this.releaseCouponRedemption(prisma, payment.orderId);
  }

  private async releaseCouponRedemption(
    prisma: Prisma.TransactionClient,
    orderId: number,
  ): Promise<void> {
    const redemption = await prisma.couponRedemption.findUnique({
      where: { orderId },
      include: { coupon: { select: { remainingUses: true } } },
    });
    if (!redemption || redemption.status !== 'REDEEMED') return;
    await prisma.couponRedemption.update({
      where: { id: redemption.id },
      data: { status: 'RELEASED' },
    });
    await prisma.coupon.update({
      where: { id: redemption.couponId },
      data: {
        usedCount: { decrement: 1 },
        ...(redemption.coupon.remainingUses !== null
          ? { remainingUses: { increment: 1 } }
          : {}),
      },
    });
  }

  private toCompletedEvent(
    refund: RefundView,
    eventId: string,
  ): RefundCompletedEvent {
    return {
      eventId,
      refundId: refund.id,
      paymentId: refund.paymentId,
      orderId: refund.payment.order.id,
      orderNumber: refund.payment.order.orderNumber,
      customer: {
        id: refund.payment.order.userId,
        name: refund.payment.order.customerName,
        email: refund.payment.order.customerEmail,
      },
      amount: refund.amount,
      currency: refund.currency,
      reason: refund.reason,
      refundDate: refund.completedAt?.toISOString() ?? new Date().toISOString(),
    };
  }
}
