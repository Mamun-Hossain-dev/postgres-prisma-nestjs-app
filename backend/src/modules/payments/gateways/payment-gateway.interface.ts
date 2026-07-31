export interface CreatePaymentIntentInput {
  amount: number;
  currency: string;
  idempotencyKey: string;
  metadata: Record<string, string>;
  receiptEmail: string;
}

export interface PaymentIntentResult {
  id: string;
  clientSecret: string;
  status: string;
}

export interface GatewayWebhookEvent {
  id: string;
  type: string;
  paymentIntentId?: string;
  paymentStatus?: 'PROCESSING' | 'SUCCEEDED' | 'FAILED' | 'CANCELLED';
  amount?: number;
  currency?: string;
  metadata?: Record<string, string>;
  failureCode?: string;
  failureMessage?: string;
}

export abstract class PaymentGateway {
  abstract createPaymentIntent(
    input: CreatePaymentIntentInput,
  ): Promise<PaymentIntentResult>;

  abstract retrievePaymentIntent(id: string): Promise<PaymentIntentResult>;

  abstract refund(
    paymentIntentId: string,
    amount?: number,
    idempotencyKey?: string,
  ): Promise<{ id: string; status: string | null }>;

  abstract verifyWebhook(
    rawBody: Buffer,
    signature: string,
  ): GatewayWebhookEvent;
}

export class PaymentGatewayError extends Error {
  constructor(
    message: string,
    readonly code: string,
  ) {
    super(message);
  }
}

export class WebhookVerificationError extends Error {}
