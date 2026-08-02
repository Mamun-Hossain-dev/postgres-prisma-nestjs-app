import { randomUUID } from 'node:crypto';
import { Inject, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AppException } from '../../common/exceptions/app.exception';
import { RedisService } from '../../infrastructure/redis/redis.service';
import {
  PaymentGateway,
  PaymentGatewayError,
  type PaymentIntentResult,
} from './gateways/payment-gateway.interface';
import { PAYMENT_REPOSITORY } from './constants/payment.constants';
import type {
  CheckoutSession,
  CheckoutCustomer,
  CheckoutItemInput,
  CheckoutOptions,
  PaymentView,
  PublicPaymentView,
} from './interfaces/payment.interface';
import type { PaymentRepository } from './repositories/payment.repository';

@Injectable()
export class PaymentService {
  private readonly logger = new Logger(PaymentService.name);
  private readonly currency: string;
  private readonly minorUnit: number;
  private readonly lockTtlSeconds: number;

  constructor(
    @Inject(PAYMENT_REPOSITORY)
    private readonly repository: PaymentRepository,
    private readonly gateway: PaymentGateway,
    private readonly redis: RedisService,
    configService: ConfigService,
  ) {
    this.currency = configService.getOrThrow<string>('stripe.currency');
    this.minorUnit = configService.getOrThrow<number>('stripe.minorUnit');
    this.lockTtlSeconds = configService.getOrThrow<number>(
      'stripe.paymentLockTtlSeconds',
    );
  }

  async createCheckout(
    user: CheckoutCustomer,
    idempotencyKey: string,
    items: CheckoutItemInput[],
    options: CheckoutOptions,
  ): Promise<CheckoutSession> {
    if (!items.length) {
      throw new AppException('Select at least one product for checkout', {
        code: 'CHECKOUT_ITEMS_REQUIRED',
        status: 400,
      });
    }
    const existing = await this.repository.findByIdempotencyKey(
      user.id,
      idempotencyKey,
    );
    if (existing) {
      this.assertCheckoutMatches(existing, items, options);
      return this.resumeOrReturn(existing, user.email);
    }

    if (!this.redis.ready) {
      throw new AppException('Checkout is temporarily unavailable', {
        code: 'PAYMENT_LOCK_UNAVAILABLE',
        status: 503,
      });
    }
    const lockKey = `payment:create:user:${user.id}`;
    const lockToken = randomUUID();
    let acquired = false;
    try {
      acquired = await this.redis.acquireLock(
        lockKey,
        lockToken,
        this.lockTtlSeconds,
      );
    } catch {
      throw new AppException('Checkout is temporarily unavailable', {
        code: 'PAYMENT_LOCK_UNAVAILABLE',
        status: 503,
      });
    }
    if (!acquired) {
      throw new AppException('A checkout is already being created', {
        code: 'CHECKOUT_ALREADY_IN_PROGRESS',
        status: 409,
      });
    }

    try {
      const retry = await this.repository.findByIdempotencyKey(
        user.id,
        idempotencyKey,
      );
      if (retry) {
        this.assertCheckoutMatches(retry, items, options);
        return this.resumeOrReturn(retry, user.email);
      }

      const active = await this.repository.findActiveByUser(user.id);
      if (active) {
        if (this.checkoutMatches(active, items, options)) {
          if (!active.providerIntentId) {
            throw new AppException(
              'An unfinished checkout exists; retry it with the same request',
              { code: 'ACTIVE_CHECKOUT_EXISTS', status: 409 },
            );
          }
          return this.toSession(
            active,
            await this.retrieveIntent(active.providerIntentId),
          );
        }
        await this.cancelReplacedCheckout(active);
      }

      const payment = await this.repository.createPendingFromItems(
        user.id,
        items,
        options,
        idempotencyKey,
        this.currency,
        this.minorUnit,
      );
      return await this.createAndAttachIntent(payment, user.email);
    } finally {
      try {
        const released = await this.redis.releaseLock(lockKey, lockToken);
        if (!released) {
          this.logger.warn(`Payment creation lock expired: ${lockKey}`);
        }
      } catch {
        this.logger.warn(`Payment creation lock was not released: ${lockKey}`);
      }
    }
  }

  async getPayment(
    userId: number,
    paymentId: number,
  ): Promise<PublicPaymentView> {
    const payment = await this.repository.findOwnedById(userId, paymentId);
    if (!payment) throw this.paymentNotFound();
    const view = { ...payment };
    delete (view as Partial<PaymentView>).idempotencyKey;
    delete (view as Partial<PaymentView>).providerIntentId;
    return view;
  }

  async getCheckoutSession(
    userId: number,
    paymentId: number,
  ): Promise<CheckoutSession> {
    const payment = await this.repository.findOwnedById(userId, paymentId);
    if (!payment) throw this.paymentNotFound();
    this.assertCurrentCheckout(payment);
    if (!payment.providerIntentId) {
      throw new AppException('Payment session is not ready', {
        code: 'PAYMENT_SESSION_NOT_READY',
        status: 409,
      });
    }
    return this.toSession(
      payment,
      await this.retrieveIntent(payment.providerIntentId),
    );
  }

  private async resumeOrReturn(
    payment: PaymentView,
    email: string,
  ): Promise<CheckoutSession> {
    if (payment.status === 'FAILED' || payment.status === 'CANCELLED') {
      throw new AppException('This checkout attempt cannot be reused', {
        code: 'CHECKOUT_ATTEMPT_FINALIZED',
        status: 409,
      });
    }
    if (!payment.providerIntentId) {
      return this.createAndAttachIntent(payment, email);
    }
    return this.toSession(
      payment,
      await this.retrieveIntent(payment.providerIntentId),
    );
  }

  private async createAndAttachIntent(
    payment: PaymentView,
    email: string,
  ): Promise<CheckoutSession> {
    let intent: PaymentIntentResult;
    try {
      intent = await this.gateway.createPaymentIntent({
        amount: payment.amount,
        currency: payment.currency,
        idempotencyKey: payment.idempotencyKey,
        receiptEmail: email,
        metadata: {
          paymentId: String(payment.id),
          orderId: String(payment.orderId),
          orderNumber: payment.order.orderNumber,
          userId: String(payment.order.userId),
          paymentMethod: payment.order.paymentMethod,
          deliveryZone: payment.order.deliveryZone,
        },
      });
    } catch (error) {
      const gatewayError =
        error instanceof PaymentGatewayError
          ? error
          : new PaymentGatewayError(
              'Payment gateway request failed',
              'PAYMENT_GATEWAY_ERROR',
            );
      await this.repository.markCreationFailed(
        payment.id,
        gatewayError.code,
        gatewayError.message,
      );
      throw new AppException(gatewayError.message, {
        code: gatewayError.code,
        status: 502,
      });
    }

    try {
      const saved = await this.repository.attachProviderIntent(
        payment.id,
        intent.id,
      );
      return this.toSession(saved, intent);
    } catch (error) {
      this.logger.error(
        `Stripe intent ${intent.id} was created but could not be attached to payment ${payment.id}`,
      );
      throw error;
    }
  }

  private toSession(
    payment: PaymentView,
    intent: { id: string; clientSecret: string },
  ): CheckoutSession {
    return {
      paymentId: payment.id,
      paymentIntentId: intent.id,
      orderId: payment.orderId,
      orderNumber: payment.order.orderNumber,
      clientSecret: intent.clientSecret,
      amount: payment.amount,
      currency: payment.currency,
      paymentStatus: payment.status,
      paymentMethod: payment.order.paymentMethod,
      deliveryZone: payment.order.deliveryZone,
      subtotalAmount: payment.order.subtotalAmount,
      discountAmount: payment.order.discountAmount,
      deliveryCharge: payment.order.deliveryCharge,
      orderTotal: payment.order.totalAmount,
      dueOnDelivery:
        payment.order.paymentMethod === 'CASH_ON_DELIVERY'
          ? payment.order.subtotalAmount - payment.order.discountAmount
          : 0,
      items: payment.order.items,
    };
  }

  private checkoutMatches(
    payment: PaymentView,
    items: CheckoutItemInput[],
    options: CheckoutOptions,
  ): boolean {
    const expectedDeliveryCharge =
      (options.deliveryZone === 'DHAKA' ? 60 : 120) * this.minorUnit;
    const expectedCoupon = options.couponCode?.trim().toUpperCase() || null;
    const requestedItems = [...items].sort((a, b) => a.productId - b.productId);
    const savedItems = payment.order.items
      .map(({ productId, quantity }) => ({ productId, quantity }))
      .sort((a, b) => (a.productId ?? 0) - (b.productId ?? 0));

    return (
      payment.currency.toLowerCase() === this.currency &&
      payment.order.currency.toLowerCase() === this.currency &&
      payment.order.paymentMethod === options.paymentMethod &&
      payment.order.deliveryZone === options.deliveryZone &&
      payment.order.deliveryCharge === expectedDeliveryCharge &&
      payment.order.couponCode === expectedCoupon &&
      requestedItems.length === savedItems.length &&
      requestedItems.every(
        (item, index) =>
          item.productId === savedItems[index]?.productId &&
          item.quantity === savedItems[index]?.quantity,
      )
    );
  }

  private assertCheckoutMatches(
    payment: PaymentView,
    items: CheckoutItemInput[],
    options: CheckoutOptions,
  ): void {
    if (!this.checkoutMatches(payment, items, options)) {
      throw new AppException('Checkout details changed; start checkout again', {
        code: 'CHECKOUT_REQUEST_CHANGED',
        status: 409,
      });
    }
  }

  private assertCurrentCheckout(payment: PaymentView): void {
    const expectedDeliveryCharge =
      (payment.order.deliveryZone === 'DHAKA' ? 60 : 120) * this.minorUnit;
    const expectedAmount =
      payment.order.paymentMethod === 'CASH_ON_DELIVERY'
        ? expectedDeliveryCharge
        : payment.order.totalAmount;
    if (
      payment.currency.toLowerCase() !== this.currency ||
      payment.order.currency.toLowerCase() !== this.currency ||
      payment.order.deliveryCharge !== expectedDeliveryCharge ||
      payment.amount !== expectedAmount
    ) {
      throw new AppException(
        'This checkout is outdated; start checkout again',
        {
          code: 'CHECKOUT_SESSION_OUTDATED',
          status: 409,
        },
      );
    }
  }

  private async cancelReplacedCheckout(payment: PaymentView): Promise<void> {
    if (payment.providerIntentId) {
      try {
        await this.gateway.cancelPaymentIntent(payment.providerIntentId);
      } catch (error) {
        const gatewayError =
          error instanceof PaymentGatewayError
            ? error
            : new PaymentGatewayError(
                'Payment gateway request failed',
                'PAYMENT_GATEWAY_ERROR',
              );
        throw new AppException(gatewayError.message, {
          code: gatewayError.code,
          status: 502,
        });
      }
    }
    await this.repository.markCancelled(
      payment.id,
      'Replaced because the selected items or checkout options changed',
    );
  }

  private async retrieveIntent(id: string): Promise<PaymentIntentResult> {
    try {
      return await this.gateway.retrievePaymentIntent(id);
    } catch (error) {
      const gatewayError =
        error instanceof PaymentGatewayError
          ? error
          : new PaymentGatewayError(
              'Payment gateway request failed',
              'PAYMENT_GATEWAY_ERROR',
            );
      throw new AppException(gatewayError.message, {
        code: gatewayError.code,
        status: 502,
      });
    }
  }

  private paymentNotFound() {
    return new AppException('Payment not found', {
      code: 'PAYMENT_NOT_FOUND',
      status: 404,
    });
  }
}
