import type {
  CheckoutItemInput,
  CheckoutOptions,
  PaymentView,
  VerifiedPaymentEvent,
  WebhookProcessingResult,
} from '../interfaces/payment.interface';

export interface PaymentRepository {
  findByIdempotencyKey(
    userId: number,
    idempotencyKey: string,
  ): Promise<PaymentView | null>;
  findActiveByUser(userId: number): Promise<PaymentView | null>;
  findByOrderId(orderId: number): Promise<PaymentView | null>;
  findOwnedById(userId: number, paymentId: number): Promise<PaymentView | null>;
  createPendingFromItems(
    userId: number,
    items: CheckoutItemInput[],
    options: CheckoutOptions,
    idempotencyKey: string,
    currency: string,
    minorUnit: number,
  ): Promise<PaymentView>;
  attachProviderIntent(
    paymentId: number,
    providerIntentId: string,
  ): Promise<PaymentView>;
  markCreationFailed(
    paymentId: number,
    code: string,
    message: string,
  ): Promise<void>;
  markCancelled(paymentId: number, reason: string): Promise<void>;
  processWebhook(event: VerifiedPaymentEvent): Promise<WebhookProcessingResult>;
}
