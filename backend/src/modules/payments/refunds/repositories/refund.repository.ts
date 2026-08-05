import type { PaginatedResult } from '../../../../common/interfaces/pagination.interface';
import type { PaymentView } from '../../interfaces/payment.interface';
import type {
  CreateRefundInput,
  RefundListQuery,
  RefundView,
  RefundWebhookProcessingResult,
  VerifiedRefundEvent,
} from '../interfaces/refund.interface';

export interface RefundRepository {
  findById(id: number): Promise<RefundView | null>;
  findByIdempotencyKey(idempotencyKey: string): Promise<RefundView | null>;
  findAllByPaymentId(paymentId: number): Promise<RefundView[]>;
  findAll(query: RefundListQuery): Promise<PaginatedResult<RefundView>>;
  createForPayment(
    payment: PaymentView,
    input: CreateRefundInput,
  ): Promise<RefundView>;
  processRefundWebhook(
    event: VerifiedRefundEvent,
  ): Promise<RefundWebhookProcessingResult>;
}
