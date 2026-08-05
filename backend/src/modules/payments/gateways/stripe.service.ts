import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Stripe from 'stripe';
import {
  type CreatePaymentIntentInput,
  type GatewayWebhookEvent,
  PaymentGateway,
  PaymentGatewayError,
  type PaymentIntentResult,
  WebhookVerificationError,
} from './payment-gateway.interface';

@Injectable()
export class StripeService implements PaymentGateway {
  private readonly stripe: Stripe;
  private readonly enabled: boolean;
  private readonly webhookSecret: string;

  constructor(configService: ConfigService) {
    this.enabled = configService.get<boolean>('stripe.enabled', false);
    this.webhookSecret = configService.get<string>('stripe.webhookSecret', '');
    this.stripe = new Stripe(
      configService.get<string>('stripe.secretKey') || 'sk_test_disabled',
    );
  }

  async createPaymentIntent(
    input: CreatePaymentIntentInput,
  ): Promise<PaymentIntentResult> {
    this.assertEnabled();
    try {
      const intent = await this.stripe.paymentIntents.create(
        {
          amount: input.amount,
          currency: input.currency,
          payment_method_types: ['card'],
          metadata: input.metadata,
          receipt_email: input.receiptEmail,
        },
        { idempotencyKey: input.idempotencyKey },
      );
      return this.toResult(intent);
    } catch (error) {
      throw this.toGatewayError(error);
    }
  }

  async retrievePaymentIntent(id: string): Promise<PaymentIntentResult> {
    this.assertEnabled();
    try {
      return this.toResult(await this.stripe.paymentIntents.retrieve(id));
    } catch (error) {
      throw this.toGatewayError(error);
    }
  }

  async cancelPaymentIntent(id: string): Promise<void> {
    this.assertEnabled();
    try {
      await this.stripe.paymentIntents.cancel(id);
    } catch (error) {
      throw this.toGatewayError(error);
    }
  }

  async refund(
    paymentIntentId: string,
    amount?: number,
    idempotencyKey?: string,
    reason?: string,
  ) {
    this.assertEnabled();
    try {
      const refund = await this.stripe.refunds.create(
        {
          payment_intent: paymentIntentId,
          ...(amount === undefined ? {} : { amount }),
          ...(reason ? { metadata: { reason } } : {}),
        },
        idempotencyKey ? { idempotencyKey } : undefined,
      );
      return { id: refund.id, status: refund.status };
    } catch (error) {
      throw this.toGatewayError(error);
    }
  }

  verifyWebhook(rawBody: Buffer, signature: string): GatewayWebhookEvent {
    this.assertEnabled();
    let event: Stripe.Event;
    try {
      event = this.stripe.webhooks.constructEvent(
        rawBody,
        signature,
        this.webhookSecret,
      );
    } catch {
      throw new WebhookVerificationError('Invalid Stripe webhook signature');
    }

    if (event.type.startsWith('refund.')) {
      const refund = event.data.object as Stripe.Refund;
      return {
        id: event.id,
        type: event.type,
        refundId: refund.id,
        paymentIntentId:
          typeof refund.payment_intent === 'string'
            ? refund.payment_intent
            : refund.payment_intent?.id,
        refundStatus: this.mapRefundStatus(refund.status),
        refundAmount: refund.amount,
        currency: refund.currency,
        refundReason: refund.metadata?.reason ?? null,
        failureCode: refund.failure_reason,
        failureMessage: refund.failure_reason,
      };
    }

    if (!event.type.startsWith('payment_intent.')) {
      return { id: event.id, type: event.type };
    }

    const intent = event.data.object as Stripe.PaymentIntent;
    const paymentStatus = this.mapWebhookStatus(event.type);
    return {
      id: event.id,
      type: event.type,
      paymentIntentId: intent.id,
      paymentStatus,
      amount: intent.amount,
      currency: intent.currency,
      metadata: intent.metadata,
      failureCode: intent.last_payment_error?.code,
      failureMessage: intent.last_payment_error?.message,
    };
  }

  private toResult(intent: Stripe.PaymentIntent): PaymentIntentResult {
    if (!intent.client_secret) {
      throw new PaymentGatewayError(
        'Stripe did not return a client secret',
        'MISSING_CLIENT_SECRET',
      );
    }
    return {
      id: intent.id,
      clientSecret: intent.client_secret,
      status: intent.status,
      amount: intent.amount,
      currency: intent.currency,
      metadata: intent.metadata,
    };
  }

  private mapWebhookStatus(type: string) {
    if (type === 'payment_intent.succeeded') return 'SUCCEEDED' as const;
    if (type === 'payment_intent.processing') return 'PROCESSING' as const;
    if (type === 'payment_intent.canceled') return 'CANCELLED' as const;
    if (type === 'payment_intent.payment_failed') return 'FAILED' as const;
    return undefined;
  }

  private mapRefundStatus(status: string | null) {
    if (status === 'succeeded') return 'SUCCEEDED' as const;
    if (status === 'failed' || status === 'canceled') return 'FAILED' as const;
    return 'PENDING' as const;
  }

  private assertEnabled(): void {
    if (!this.enabled) {
      throw new PaymentGatewayError(
        'Stripe payments are not configured',
        'PAYMENT_GATEWAY_DISABLED',
      );
    }
  }

  private toGatewayError(error: unknown): PaymentGatewayError {
    if (error instanceof PaymentGatewayError) return error;
    if (error instanceof Stripe.errors.StripeError) {
      return new PaymentGatewayError(
        error.message,
        error.code ?? 'STRIPE_ERROR',
      );
    }
    return new PaymentGatewayError(
      'Payment gateway request failed',
      'PAYMENT_GATEWAY_ERROR',
    );
  }
}
