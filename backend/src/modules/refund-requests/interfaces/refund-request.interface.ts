import type { PaginatedResult } from '../../../common/interfaces/pagination.interface';
import type {
  CheckoutPaymentMethod,
  OrderStatus,
  PaymentStatus,
} from '../../payments/interfaces/payment.interface';
import type { RefundStatus } from '../../payments/refunds/interfaces/refund.interface';

export type RefundRequestStatus = 'PENDING' | 'APPROVED' | 'DENIED';

export interface RefundRequestView {
  id: number;
  orderId: number;
  userId: number;
  reason: string;
  status: RefundRequestStatus;
  refundId: number | null;
  adminId: number | null;
  decisionNote: string | null;
  reviewedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  order: {
    id: number;
    orderNumber: string;
    status: OrderStatus;
    totalAmount: number;
    currency: string;
    customerName: string;
    customerEmail: string;
    paymentMethod: CheckoutPaymentMethod;
  };
  refund: {
    id: number;
    amount: number;
    currency: string;
    status: RefundStatus;
  } | null;
}

export interface RefundableOrder {
  orderId: number;
  orderNumber: string;
  orderStatus: OrderStatus;
  paymentId: number | null;
  paymentStatus: PaymentStatus | null;
  refundable: boolean;
}

export interface RefundRequestListQuery {
  page: number;
  limit: number;
  status?: RefundRequestStatus;
  orderId?: number;
}

export type RefundRequestListResult = PaginatedResult<RefundRequestView>;
