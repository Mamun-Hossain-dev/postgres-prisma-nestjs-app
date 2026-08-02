import { randomUUID } from 'node:crypto';
import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { AppException } from '../../../common/exceptions/app.exception';
import { PrismaService } from '../../../infrastructure/prisma/prisma.service';
import { ACTIVE_PAYMENT_STATUSES } from '../constants/payment.constants';
import type {
  CheckoutItemInput,
  CheckoutOptions,
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

  findByOrderId(orderId: number): Promise<PaymentView | null> {
    return this.prisma.payment.findFirst({
      where: { orderId },
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

  createPendingFromItems(
    userId: number,
    checkoutItems: CheckoutItemInput[],
    options: CheckoutOptions,
    idempotencyKey: string,
    currency: string,
    minorUnit: number,
  ): Promise<PaymentView> {
    return this.prisma.$transaction(async (prisma) => {
      const productIds = checkoutItems.map((item) => item.productId);
      if (new Set(productIds).size !== productIds.length) {
        throw new AppException('Checkout contains duplicate products', {
          code: 'DUPLICATE_CHECKOUT_ITEM',
          status: 400,
        });
      }

      const [user, products] = await Promise.all([
        prisma.user.findUnique({ where: { id: userId } }),
        prisma.product.findMany({ where: { id: { in: productIds } } }),
      ]);
      if (!user) {
        throw new AppException('Checkout customer was not found', {
          code: 'CHECKOUT_CUSTOMER_NOT_FOUND',
          status: 404,
        });
      }
      const productsById = new Map(
        products.map((product) => [product.id, product]),
      );

      const now = new Date();
      for (const item of checkoutItems) {
        const product = productsById.get(item.productId);
        if (
          !product ||
          product.status !== 'ACTIVE' ||
          product.publishedAt > now ||
          item.quantity > product.quantity
        ) {
          throw new AppException(
            product
              ? `${product.title} is unavailable in the requested quantity`
              : 'A checkout product is no longer available',
            {
              code: 'CHECKOUT_ITEM_UNAVAILABLE',
              status: 409,
              details: { productId: item.productId },
            },
          );
        }
      }

      const items = checkoutItems.map((item) => {
        const product = productsById.get(item.productId)!;
        const unitAmount = Math.round(product.price * minorUnit);
        return {
          productId: item.productId,
          productTitle: product.title,
          productSku: product.sku,
          unitAmount,
          quantity: item.quantity,
          totalAmount: unitAmount * item.quantity,
        };
      });
      const subtotalAmount = items.reduce(
        (sum, item) => sum + item.totalAmount,
        0,
      );
      const couponCode = options.couponCode?.trim().toUpperCase();
      const coupon = couponCode
        ? await prisma.coupon.findUnique({ where: { code: couponCode } })
        : null;
      if (couponCode) {
        const invalid =
          !coupon ||
          !coupon.isActive ||
          (coupon.startsAt !== null && coupon.startsAt > now) ||
          (coupon.endsAt !== null && coupon.endsAt < now) ||
          coupon.minimumAmount > subtotalAmount;
        if (invalid) {
          throw new AppException('Coupon is invalid for this order', {
            code: 'INVALID_COUPON',
            status: 400,
          });
        }
        if (coupon.remainingUses !== null) {
          const reserved = await prisma.coupon.updateMany({
            where: { id: coupon.id, remainingUses: { gt: 0 } },
            data: { remainingUses: { decrement: 1 } },
          });
          if (!reserved.count) {
            throw new AppException('Coupon usage limit has been reached', {
              code: 'COUPON_USAGE_LIMIT_REACHED',
              status: 409,
            });
          }
        }
      }
      const discountAmount = coupon
        ? coupon.type === 'PERCENTAGE'
          ? Math.floor((subtotalAmount * coupon.value) / 100)
          : Math.min(coupon.value, subtotalAmount)
        : 0;
      const deliveryCharge =
        (options.deliveryZone === 'DHAKA' ? 60 : 120) * minorUnit;
      const discountedSubtotal = subtotalAmount - discountAmount;
      const totalAmount = discountedSubtotal + deliveryCharge;
      const payableAmount =
        options.paymentMethod === 'CASH_ON_DELIVERY'
          ? deliveryCharge
          : totalAmount;
      const order = await prisma.order.create({
        data: {
          orderNumber: `DD-${randomUUID().replaceAll('-', '').slice(0, 12).toUpperCase()}`,
          userId,
          customerName: user.name,
          customerEmail: user.email,
          couponId: coupon?.id,
          couponCode,
          paymentMethod: options.paymentMethod,
          deliveryZone: options.deliveryZone,
          subtotalAmount,
          discountAmount,
          deliveryCharge,
          totalAmount,
          currency,
          items: { create: items },
        },
      });
      const payment = await prisma.payment.create({
        data: {
          orderId: order.id,
          amount: payableAmount,
          currency,
          idempotencyKey,
        },
        include: paymentInclude,
      });
      if (coupon) {
        await prisma.couponRedemption.create({
          data: { couponId: coupon.id, userId, orderId: order.id },
        });
      }
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
      await this.releaseCouponReservation(prisma, payment.orderId);
    });
  }

  async markCancelled(paymentId: number, reason: string): Promise<void> {
    await this.prisma.$transaction(async (prisma) => {
      const payment = await prisma.payment.update({
        where: { id: paymentId },
        data: {
          status: 'CANCELLED',
          failureCode: 'CHECKOUT_REPLACED',
          failureMessage: reason,
        },
      });
      await prisma.order.update({
        where: { id: payment.orderId },
        data: { status: 'CANCELLED' },
      });
      await this.releaseCouponReservation(prisma, payment.orderId);
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
            data:
              payment.order.paymentMethod === 'CASH_ON_DELIVERY'
                ? { status: 'COD_CONFIRMED' }
                : { status: 'PAID', paidAt },
          });
          await this.redeemCouponReservation(prisma, payment.orderId);
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
        if (paymentStatus === 'FAILED' || paymentStatus === 'CANCELLED') {
          await this.releaseCouponReservation(prisma, payment.orderId);
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
      orderTotal: payment.order.totalAmount,
      subtotalAmount: payment.order.subtotalAmount,
      discountAmount: payment.order.discountAmount,
      deliveryCharge: payment.order.deliveryCharge,
      dueOnDelivery:
        payment.order.paymentMethod === 'CASH_ON_DELIVERY'
          ? payment.order.subtotalAmount - payment.order.discountAmount
          : 0,
      paymentMethod: payment.order.paymentMethod,
      deliveryZone: payment.order.deliveryZone,
      currency: payment.currency,
      paymentStatus: 'SUCCEEDED',
      paymentDate: paidAt.toISOString(),
    };
  }

  private async redeemCouponReservation(
    prisma: Prisma.TransactionClient,
    orderId: number,
  ) {
    const redemption = await prisma.couponRedemption.findUnique({
      where: { orderId },
    });
    if (!redemption || redemption.status !== 'RESERVED') return;
    await prisma.couponRedemption.update({
      where: { id: redemption.id },
      data: { status: 'REDEEMED' },
    });
    await prisma.coupon.update({
      where: { id: redemption.couponId },
      data: { usedCount: { increment: 1 } },
    });
  }

  private async releaseCouponReservation(
    prisma: Prisma.TransactionClient,
    orderId: number,
  ) {
    const redemption = await prisma.couponRedemption.findUnique({
      where: { orderId },
      include: { coupon: { select: { remainingUses: true } } },
    });
    if (!redemption || redemption.status !== 'RESERVED') return;
    await prisma.couponRedemption.update({
      where: { id: redemption.id },
      data: { status: 'RELEASED' },
    });
    if (redemption.coupon.remainingUses !== null) {
      await prisma.coupon.update({
        where: { id: redemption.couponId },
        data: { remainingUses: { increment: 1 } },
      });
    }
  }
}
