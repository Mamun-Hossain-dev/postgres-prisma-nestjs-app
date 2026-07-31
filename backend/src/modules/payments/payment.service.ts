import { randomUUID } from 'node:crypto';
import { Inject, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AppException } from '../../common/exceptions/app.exception';
import { RedisService } from '../../infrastructure/redis/redis.service';
import type { PublicUser } from '../users/interfaces/user.interface';
import {
  PaymentGateway,
  PaymentGatewayError,
  type PaymentIntentResult,
} from './gateways/payment-gateway.interface';
import { PAYMENT_REPOSITORY } from './constants/payment.constants';
import type {
  CheckoutSession,
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
    user: PublicUser,
    idempotencyKey: string,
  ): Promise<CheckoutSession> {
    const existing = await this.repository.findByIdempotencyKey(
      user.id,
      idempotencyKey,
    );
    if (existing) return this.resumeOrReturn(existing, user.email);

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
      if (retry) return this.resumeOrReturn(retry, user.email);

      const active = await this.repository.findActiveByUser(user.id);
      if (active) {
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

      const payment = await this.repository.createPendingFromCart(
        user.id,
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
    intent: { clientSecret: string },
  ): CheckoutSession {
    return {
      paymentId: payment.id,
      orderId: payment.orderId,
      orderNumber: payment.order.orderNumber,
      clientSecret: intent.clientSecret,
      amount: payment.amount,
      currency: payment.currency,
      paymentStatus: payment.status,
    };
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
