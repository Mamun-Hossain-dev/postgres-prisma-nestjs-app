import type { PaginatedResult } from '../../../../common/interfaces/pagination.interface';
import type {
  CheckoutPaymentMethod,
  OrderStatus,
  PaymentStatus,
} from '../../interfaces/payment.interface';

export type RefundStatus = 'PENDING' | 'SUCCEEDED' | 'FAILED';

export interface RefundView {
  id: number;
  paymentId: number;
  providerRefundId: string | null;
  amount: number;
  currency: string;
  reason: string | null;
  status: RefundStatus;
  failureCode: string | null;
  failureMessage: string | null;
  requestedById: number | null;
  idempotencyKey: string;
  completedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  payment: {
    id: number;
    orderId: number;
    providerIntentId: string | null;
    status: PaymentStatus;
    amount: number;
    currency: string;
    order: {
      id: number;
      orderNumber: string;
      userId: number;
      customerName: string;
      customerEmail: string;
      paymentMethod: CheckoutPaymentMethod;
      totalAmount: number;
      status: OrderStatus;
    };
  };
}

export interface CreateRefundInput {
  providerRefundId: string;
  amount: number;
  reason: string | null;
  requestedById: number;
  idempotencyKey: string;
}

export interface RefundListQuery {
  page: number;
  limit: number;
  status?: RefundStatus;
  paymentId?: number;
}

export interface VerifiedRefundEvent {
  id: string;
  type: string;
  refundId?: string;
  paymentIntentId?: string;
  refundStatus?: RefundStatus;
  refundAmount?: number;
  currency?: string;
  refundReason?: string | null;
  failureCode?: string;
  failureMessage?: string;
  metadata?: Record<string, string>;
}

export interface RefundCompletedEvent {
  eventId: string;
  refundId: number;
  paymentId: number;
  orderId: number;
  orderNumber: string;
  customer: {
    id: number;
    name: string;
    email: string;
  };
  amount: number;
  currency: string;
  reason: string | null;
  refundDate: string;
}

export interface RefundWebhookProcessingResult {
  duplicate: boolean;
  completedEvent?: RefundCompletedEvent;
}

export type RefundListResult = PaginatedResult<RefundView>;
