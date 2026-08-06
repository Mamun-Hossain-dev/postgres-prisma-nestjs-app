import { randomUUID } from 'node:crypto';
import { Inject, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AppException } from '../../common/exceptions/app.exception';
import { RedisService } from '../../infrastructure/redis/redis.service';
import {
  PaymentGateway,
  PaymentGatewayError,
  type PaymentIntentResult,
  type GatewayWebhookEvent,
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
import { PaymentWebhookService } from './payment-webhook.service';
import { REFUND_REPOSITORY } from './refunds/constants/refund.constants';
import type { RefundRepository } from './refunds/repositories/refund.repository';
import type { RefundView } from './refunds/interfaces/refund.interface';
import { RefundEventsPublisher } from './refunds/refund-events.publisher';
import {
  getDeliveryCharge,
  getDueOnDelivery,
  getPayableAmount,
} from './utils/checkout-amount.util';

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
    private readonly webhookService: PaymentWebhookService,
    @Inject(REFUND_REPOSITORY)
    private readonly refundRepository: RefundRepository,
    private readonly refundEventsPublisher: RefundEventsPublisher,
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
      return this.resumeOrReturn(existing);
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
        return this.resumeOrReturn(retry);
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
          return this.restoreSession(active);
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
      return await this.createAndAttachIntent(payment);
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
    return this.restoreSession(payment);
  }

  async cancelForOrderDeletion(orderId: number): Promise<void> {
    const payment = await this.repository.findByOrderId(orderId);
    if (!payment) return;
    if (payment.status === 'SUCCEEDED' || payment.status === 'REFUNDED') {
      throw new AppException('A completed payment order cannot be deleted', {
        code: 'ORDER_PAYMENT_FINALIZED',
        status: 409,
      });
    }
    if (payment.status === 'CANCELLED' || payment.status === 'FAILED') return;

    if (payment.providerIntentId) {
      try {
        await this.gateway.cancelPaymentIntent(payment.providerIntentId);
      } catch {
        throw new AppException(
          'The Stripe payment could not be cancelled; refresh its payment status before deleting the order',
          {
            code: 'ORDER_PAYMENT_CANCELLATION_FAILED',
            status: 409,
          },
        );
      }
    }
    await this.repository.markCancelled(
      payment.id,
      'Cancelled before the pending order was deleted by an administrator',
    );
  }

  async cancelForAdmin(orderId: number): Promise<void> {
    const payment = await this.repository.findByOrderId(orderId);
    if (!payment) return;
    if (payment.status === 'REFUNDED' || payment.status === 'CANCELLED') return;

    if (payment.status === 'SUCCEEDED') {
      if (!payment.providerIntentId) {
        throw new AppException('The completed payment cannot be refunded', {
          code: 'ORDER_REFUND_UNAVAILABLE',
          status: 409,
        });
      }
      try {
        await this.gateway.refund(
          payment.providerIntentId,
          payment.amount,
          `admin-order-cancel-${orderId}`,
        );
      } catch (error) {
        const gatewayError =
          error instanceof PaymentGatewayError
            ? error
            : new PaymentGatewayError(
                'The payment refund failed',
                'ORDER_REFUND_FAILED',
              );
        throw new AppException(gatewayError.message, {
          code: gatewayError.code,
          status: 502,
        });
      }
      await this.repository.markRefundedAndCancel(payment.id);
      return;
    }

    if (payment.status === 'FAILED') return;
    if (payment.providerIntentId) {
      await this.gateway.cancelPaymentIntent(payment.providerIntentId);
    }
    await this.repository.markCancelled(
      payment.id,
      'Order cancelled by an administrator',
    );
  }

  async getRefundablePaymentForOrder(
    orderId: number,
  ): Promise<{ id: number } | null> {
    const payment = await this.repository.findByOrderId(orderId);
    if (!payment || payment.status !== 'SUCCEEDED') return null;
    if (!payment.providerIntentId) {
      throw new AppException('The completed payment cannot be refunded', {
        code: 'REFUND_UNAVAILABLE',
        status: 409,
      });
    }
    return { id: payment.id };
  }

  async requestRefund(
    paymentId: number,
    requestedByUserId: number,
    amount: number | undefined,
    reason: string | undefined,
    idempotencyKey: string,
  ): Promise<RefundView> {
    if (!this.redis.ready) {
      throw new AppException('Refunds are temporarily unavailable', {
        code: 'REFUND_LOCK_UNAVAILABLE',
        status: 503,
      });
    }

    const existing =
      await this.refundRepository.findByIdempotencyKey(idempotencyKey);
    if (existing) {
      this.assertRefundRequestMatches(existing, paymentId, amount);
      return existing;
    }

    const lockKey = `refund:payment:${paymentId}`;
    const lockToken = randomUUID();
    let acquired = false;
    try {
      acquired = await this.redis.acquireLock(
        lockKey,
        lockToken,
        this.lockTtlSeconds,
      );
    } catch {
      throw new AppException('Refunds are temporarily unavailable', {
        code: 'REFUND_LOCK_UNAVAILABLE',
        status: 503,
      });
    }
    if (!acquired) {
      throw new AppException('A refund is already being processed', {
        code: 'REFUND_ALREADY_IN_PROGRESS',
        status: 409,
      });
    }

    try {
      const retry =
        await this.refundRepository.findByIdempotencyKey(idempotencyKey);
      if (retry) {
        this.assertRefundRequestMatches(retry, paymentId, amount);
        return retry;
      }

      const payment = await this.repository.findById(paymentId);
      if (!payment) throw this.refundPaymentNotFound();

      const refundAmount = await this.resolveRefundAmount(payment, amount);
      let refundResult: { id: string; status: string | null };
      try {
        refundResult = await this.gateway.refund(
          payment.providerIntentId!,
          refundAmount,
          idempotencyKey,
          reason?.trim(),
        );
      } catch (error) {
        if (error instanceof AppException) throw error;
        const gatewayError =
          error instanceof PaymentGatewayError
            ? error
            : new PaymentGatewayError(
                'The refund request failed',
                'REFUND_REQUEST_FAILED',
              );
        throw new AppException(gatewayError.message, {
          code: gatewayError.code,
          status: 502,
        });
      }

      try {
        return await this.refundRepository.createForPayment(payment, {
          providerRefundId: refundResult.id,
          amount: refundAmount,
          reason: reason?.trim() || null,
          requestedById: requestedByUserId,
          idempotencyKey,
        });
      } catch (error) {
        this.logger.error(
          `Refund ${refundResult.id} was created at the gateway but could not be saved`,
          error instanceof Error ? error.stack : undefined,
        );
        throw new AppException(
          'The refund was created but could not be recorded; retry with the same idempotency key',
          { code: 'REFUND_RECORD_FAILED', status: 502 },
        );
      }
    } finally {
      try {
        const released = await this.redis.releaseLock(lockKey, lockToken);
        if (!released) {
          this.logger.warn(`Refund lock expired: ${lockKey}`);
        }
      } catch {
        this.logger.warn(`Refund lock was not released: ${lockKey}`);
      }
    }
  }

  async processRefundWebhook(event: GatewayWebhookEvent): Promise<void> {
    if (!event.refundId) {
      this.logger.debug(`Refund webhook has no refund id: ${event.id}`);
      return;
    }
    const result = await this.refundRepository.processRefundWebhook(event);
    if (result.completedEvent) {
      await this.refundEventsPublisher.publishCompleted(result.completedEvent);
    }
  }

  private async resolveRefundAmount(
    payment: PaymentView,
    requestedAmount?: number,
  ): Promise<number> {
    if (payment.status !== 'SUCCEEDED') {
      throw new AppException('Only successful payments can be refunded', {
        code: 'REFUND_PAYMENT_NOT_SUCCESSFUL',
        status: 409,
      });
    }
    if (!payment.providerIntentId) {
      throw new AppException('The completed payment cannot be refunded', {
        code: 'REFUND_UNAVAILABLE',
        status: 409,
      });
    }

    const refunds = await this.refundRepository.findAllByPaymentId(payment.id);
    const alreadyRefunded = refunds.reduce(
      (sum, refund) => (refund.status === 'FAILED' ? sum : sum + refund.amount),
      0,
    );
    const remaining = payment.amount - alreadyRefunded;
    if (remaining <= 0) {
      throw new AppException('This payment is already fully refunded', {
        code: 'REFUND_PAYMENT_FULLY_REFUNDED',
        status: 409,
      });
    }

    const amount = requestedAmount ?? remaining;
    if (amount > payment.amount) {
      throw new AppException('Refund amount exceeds the paid amount', {
        code: 'INVALID_REFUND_AMOUNT',
        status: 400,
      });
    }
    if (amount > remaining) {
      throw new AppException('Refund amount exceeds the refundable balance', {
        code: 'REFUND_AMOUNT_EXCEEDS_REMAINING',
        status: 409,
      });
    }
    return amount;
  }

  private assertRefundRequestMatches(
    refund: RefundView,
    paymentId: number,
    amount?: number,
  ): void {
    if (
      refund.paymentId !== paymentId ||
      (amount && amount !== refund.amount)
    ) {
      throw new AppException('Refund request details changed; use a new id', {
        code: 'REFUND_REQUEST_CHANGED',
        status: 409,
      });
    }
  }

  private refundPaymentNotFound() {
    return new AppException('Payment not found', {
      code: 'REFUND_PAYMENT_NOT_FOUND',
      status: 404,
    });
  }

  private async resumeOrReturn(payment: PaymentView): Promise<CheckoutSession> {
    if (payment.status === 'FAILED' || payment.status === 'CANCELLED') {
      throw new AppException('This checkout attempt cannot be reused', {
        code: 'CHECKOUT_ATTEMPT_FINALIZED',
        status: 409,
      });
    }
    if (!payment.providerIntentId) {
      return this.createAndAttachIntent(payment);
    }
    return this.restoreSession(payment);
  }

  private async createAndAttachIntent(
    payment: PaymentView,
  ): Promise<CheckoutSession> {
    let intent: PaymentIntentResult;
    try {
      intent = await this.gateway.createPaymentIntent({
        amount: payment.amount,
        currency: payment.currency,
        idempotencyKey: payment.idempotencyKey,
        receiptEmail: payment.order.customerEmail,
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
      dueOnDelivery: getDueOnDelivery(
        payment.order.paymentMethod,
        payment.order.totalAmount,
        payment.amount,
      ),
      items: payment.order.items,
    };
  }

  private checkoutMatches(
    payment: PaymentView,
    items: CheckoutItemInput[],
    options: CheckoutOptions,
  ): boolean {
    const expectedDeliveryCharge = getDeliveryCharge(
      options.deliveryZone,
      this.minorUnit,
    );
    const expectedAmount = getPayableAmount(
      options.paymentMethod,
      payment.order.totalAmount,
      expectedDeliveryCharge,
      this.minorUnit,
    );
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
      payment.amount === expectedAmount &&
      payment.order.couponCode === expectedCoupon &&
      payment.order.customerName === options.customerName.trim() &&
      payment.order.customerEmail ===
        options.customerEmail.trim().toLowerCase() &&
      payment.order.customerPhone === options.customerPhone.trim() &&
      payment.order.deliveryAddressLine ===
        options.deliveryAddressLine.trim() &&
      payment.order.deliveryArea === options.deliveryArea.trim() &&
      payment.order.deliveryCity === options.deliveryCity.trim() &&
      payment.order.deliveryPostalCode ===
        (options.deliveryPostalCode?.trim() || null) &&
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
    const expectedDeliveryCharge = getDeliveryCharge(
      payment.order.deliveryZone,
      this.minorUnit,
    );
    const expectedAmount = getPayableAmount(
      payment.order.paymentMethod,
      payment.order.totalAmount,
      expectedDeliveryCharge,
      this.minorUnit,
    );
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
        const intent = await this.retrieveIntent(payment.providerIntentId);
        await this.rejectAndReconcileSucceededIntent(payment, intent);
        await this.gateway.cancelPaymentIntent(payment.providerIntentId);
      } catch (error) {
        if (error instanceof AppException) throw error;
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

  private async restoreSession(payment: PaymentView): Promise<CheckoutSession> {
    const intent = await this.retrieveIntent(payment.providerIntentId!);
    await this.rejectAndReconcileSucceededIntent(payment, intent);
    return this.toSession(payment, intent);
  }

  private async rejectAndReconcileSucceededIntent(
    payment: PaymentView,
    intent: PaymentIntentResult,
  ): Promise<void> {
    if (intent.status !== 'succeeded') return;
    await this.webhookService.handleVerified({
      id: `reconciliation:${intent.id}:succeeded`,
      type: 'payment_intent.succeeded',
      paymentIntentId: intent.id,
      paymentStatus: 'SUCCEEDED',
      amount: intent.amount,
      currency: intent.currency,
      metadata: intent.metadata,
    });
    throw new AppException('Your previous checkout payment already succeeded', {
      code: 'PAYMENT_ALREADY_SUCCEEDED',
      status: 409,
      details: { paymentId: payment.id },
    });
  }

  private paymentNotFound() {
    return new AppException('Payment not found', {
      code: 'PAYMENT_NOT_FOUND',
      status: 404,
    });
  }
}
