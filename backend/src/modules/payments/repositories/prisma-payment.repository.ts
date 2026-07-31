import { randomUUID } from 'node:crypto';
import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { AppException } from '../../../common/exceptions/app.exception';
import { PrismaService } from '../../../infrastructure/prisma/prisma.service';
import { ACTIVE_PAYMENT_STATUSES } from '../constants/payment.constants';
import type {
  PaymentSucceededEvent,
  PaymentView,
  VerifiedPaymentEvent,
  WebhookProcessingResult,
} from '../interfaces/payment.interface';
import type { PaymentRepository } from './payment.repository';

const paymentInclude = {
  order: {
    include: { items: { orderBy: { id: 'asc' as const } } },
  },
};

@Injectable()
export class PrismaPaymentRepository implements PaymentRepository {
  constructor(private readonly prisma: PrismaService) {}

  findByIdempotencyKey(
    userId: number,
    idempotencyKey: string,
  ): Promise<PaymentView | null> {
    return this.prisma.payment.findFirst({
      where: { idempotencyKey, order: { userId } },
      include: paymentInclude,
    });
  }

  findActiveByUser(userId: number): Promise<PaymentView | null> {
    return this.prisma.payment.findFirst({
      where: {
        order: { userId },
        status: { in: [...ACTIVE_PAYMENT_STATUSES] },
      },
      orderBy: { createdAt: 'desc' },
      include: paymentInclude,
    });
  }

  findOwnedById(
    userId: number,
    paymentId: number,
  ): Promise<PaymentView | null> {
    return this.prisma.payment.findFirst({
      where: { id: paymentId, order: { userId } },
      include: paymentInclude,
    });
  }

  createPendingFromCart(
    userId: number,
    idempotencyKey: string,
    currency: string,
    minorUnit: number,
  ): Promise<PaymentView> {
    return this.prisma.$transaction(async (prisma) => {
      const cart = await prisma.cart.findUnique({
        where: { userId },
        include: {
          user: true,
          items: {
            orderBy: { id: 'asc' },
            include: { product: true },
          },
        },
      });
      if (!cart?.items.length) {
        throw new AppException('Cart is empty', {
          code: 'CART_EMPTY',
          status: 400,
        });
      }

      const now = new Date();
      for (const item of cart.items) {
        if (
          item.product.status !== 'ACTIVE' ||
          item.product.publishedAt > now ||
          item.quantity > item.product.quantity
        ) {
          throw new AppException(
            `${item.product.title} is unavailable in the requested quantity`,
            {
              code: 'CHECKOUT_ITEM_UNAVAILABLE',
              status: 409,
              details: { productId: item.productId },
            },
          );
        }
      }

      const items = cart.items.map((item) => {
        const unitAmount = Math.round(item.product.price * minorUnit);
        return {
          productId: item.productId,
          productTitle: item.product.title,
          productSku: item.product.sku,
          unitAmount,
          quantity: item.quantity,
          totalAmount: unitAmount * item.quantity,
        };
      });
      const totalAmount = items.reduce(
        (sum, item) => sum + item.totalAmount,
        0,
      );
      const order = await prisma.order.create({
        data: {
          orderNumber: `DD-${randomUUID().replaceAll('-', '').slice(0, 12).toUpperCase()}`,
          userId,
          customerName: cart.user.name,
          customerEmail: cart.user.email,
          totalAmount,
          currency,
          items: { create: items },
        },
      });
      const payment = await prisma.payment.create({
        data: {
          orderId: order.id,
          amount: totalAmount,
          currency,
          idempotencyKey,
        },
        include: paymentInclude,
      });
      return payment;
    });
  }

  attachProviderIntent(
    paymentId: number,
    providerIntentId: string,
  ): Promise<PaymentView> {
    return this.prisma.payment.update({
      where: { id: paymentId },
      data: { providerIntentId },
      include: paymentInclude,
    });
  }

  async markCreationFailed(
    paymentId: number,
    code: string,
    message: string,
  ): Promise<void> {
    await this.prisma.$transaction(async (prisma) => {
      const payment = await prisma.payment.update({
        where: { id: paymentId },
        data: {
          status: 'FAILED',
          failureCode: code,
          failureMessage: message,
        },
      });
      await prisma.order.update({
        where: { id: payment.orderId },
        data: { status: 'PAYMENT_FAILED' },
      });
    });
  }

  async processWebhook(
    event: VerifiedPaymentEvent,
  ): Promise<WebhookProcessingResult> {
    try {
      return await this.prisma.$transaction(async (prisma) => {
        await prisma.paymentWebhookEvent.create({
          data: {
            provider: 'STRIPE',
            eventId: event.id,
            eventType: event.type,
          },
        });
        if (!event.paymentIntentId || !event.paymentStatus) {
          return { duplicate: false };
        }

        let payment = await prisma.payment.findUnique({
          where: { providerIntentId: event.paymentIntentId },
          include: paymentInclude,
        });
        const metadataPaymentId = Number(event.metadata?.paymentId);
        if (!payment && Number.isInteger(metadataPaymentId)) {
          const candidate = await prisma.payment.findUnique({
            where: { id: metadataPaymentId },
            include: paymentInclude,
          });
          if (candidate && !candidate.providerIntentId) {
            payment = await prisma.payment.update({
              where: { id: candidate.id },
              data: { providerIntentId: event.paymentIntentId },
              include: paymentInclude,
            });
          }
        }
        if (!payment) {
          if (!event.metadata?.paymentId && !event.metadata?.orderId) {
            return { duplicate: false };
          }
          throw new AppException('Webhook payment was not found', {
            code: 'WEBHOOK_PAYMENT_NOT_FOUND',
            status: 404,
          });
        }
        this.assertWebhookMatches(payment, event);

        if (payment.status === 'SUCCEEDED') return { duplicate: false };

        if (event.paymentStatus === 'SUCCEEDED') {
          const paidAt = new Date();
          await prisma.payment.update({
            where: { id: payment.id },
            data: {
              status: 'SUCCEEDED',
              paidAt,
              failureCode: null,
              failureMessage: null,
            },
          });
          await prisma.order.update({
            where: { id: payment.orderId },
            data: { status: 'PAID', paidAt },
          });
          const cart = await prisma.cart.findUnique({
            where: { userId: payment.order.userId },
          });
          if (cart) {
            await prisma.cartItem.deleteMany({ where: { cartId: cart.id } });
          }
          return {
            duplicate: false,
            succeededEvent: this.toSucceededEvent(payment, event.id, paidAt),
          };
        }

        const paymentStatus = event.paymentStatus;
        await prisma.payment.update({
          where: { id: payment.id },
          data: {
            status: paymentStatus,
            failureCode: event.failureCode,
            failureMessage: event.failureMessage,
          },
        });
        await prisma.order.update({
          where: { id: payment.orderId },
          data: {
            status:
              paymentStatus === 'PROCESSING'
                ? 'PAYMENT_PROCESSING'
                : paymentStatus === 'CANCELLED'
                  ? 'CANCELLED'
                  : 'PAYMENT_FAILED',
          },
        });
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
        if (event.paymentIntentId) {
          const payment = await this.prisma.payment.findUnique({
            where: { providerIntentId: event.paymentIntentId },
            include: paymentInclude,
          });
          if (payment?.status === 'SUCCEEDED' && payment.paidAt) {
            return {
              duplicate: true,
              succeededEvent: this.toSucceededEvent(
                payment,
                event.id,
                payment.paidAt,
              ),
            };
          }
        }
        return { duplicate: true };
      }
      throw error;
    }
  }

  private assertWebhookMatches(
    payment: PaymentView,
    event: VerifiedPaymentEvent,
  ): void {
    if (
      event.amount !== payment.amount ||
      event.currency?.toLowerCase() !== payment.currency.toLowerCase() ||
      event.metadata?.paymentId !== String(payment.id) ||
      event.metadata?.orderId !== String(payment.orderId)
    ) {
      throw new AppException('Webhook payment data does not match', {
        code: 'WEBHOOK_PAYMENT_MISMATCH',
        status: 400,
      });
    }
  }

  private toSucceededEvent(
    payment: PaymentView,
    eventId: string,
    paidAt: Date,
  ): PaymentSucceededEvent {
    return {
      eventId,
      orderId: payment.order.id,
      orderNumber: payment.order.orderNumber,
      paymentId: payment.id,
      customer: {
        id: payment.order.userId,
        name: payment.order.customerName,
        email: payment.order.customerEmail,
      },
      items: payment.order.items.map((item) => ({
        productTitle: item.productTitle,
        productSku: item.productSku,
        unitAmount: item.unitAmount,
        quantity: item.quantity,
        totalAmount: item.totalAmount,
      })),
      totalAmount: payment.amount,
      currency: payment.currency,
      paymentStatus: 'SUCCEEDED',
      paymentDate: paidAt.toISOString(),
    };
  }
}
