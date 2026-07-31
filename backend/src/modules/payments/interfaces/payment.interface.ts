export type PaymentStatus =
  'PENDING' | 'PROCESSING' | 'SUCCEEDED' | 'FAILED' | 'CANCELLED' | 'REFUNDED';

export type OrderStatus =
  | 'PAYMENT_PENDING'
  | 'PAYMENT_PROCESSING'
  | 'PAID'
  | 'PAYMENT_FAILED'
  | 'CANCELLED';

export interface OrderItemView {
  id: number;
  productId: number | null;
  productTitle: string;
  productSku: string;
  unitAmount: number;
  quantity: number;
  totalAmount: number;
}

export interface OrderView {
  id: number;
  orderNumber: string;
  userId: number;
  customerName: string;
  customerEmail: string;
  totalAmount: number;
  currency: string;
  status: OrderStatus;
  paidAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  items: OrderItemView[];
}

export interface PaymentView {
  id: number;
  orderId: number;
  status: PaymentStatus;
  amount: number;
  currency: string;
  idempotencyKey: string;
  providerIntentId: string | null;
  failureCode: string | null;
  failureMessage: string | null;
  paidAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  order: OrderView;
}

export type PublicPaymentView = Omit<
  PaymentView,
  'idempotencyKey' | 'providerIntentId'
>;

export interface CheckoutSession {
  paymentId: number;
  orderId: number;
  orderNumber: string;
  clientSecret: string;
  amount: number;
  currency: string;
  paymentStatus: PaymentStatus;
}

export interface PaymentSucceededEvent {
  eventId: string;
  orderId: number;
  orderNumber: string;
  paymentId: number;
  customer: {
    id: number;
    name: string;
    email: string;
  };
  items: Array<{
    productTitle: string;
    productSku: string;
    unitAmount: number;
    quantity: number;
    totalAmount: number;
  }>;
  totalAmount: number;
  currency: string;
  paymentStatus: 'SUCCEEDED';
  paymentDate: string;
}

export interface VerifiedPaymentEvent {
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

export interface WebhookProcessingResult {
  duplicate: boolean;
  succeededEvent?: PaymentSucceededEvent;
}
