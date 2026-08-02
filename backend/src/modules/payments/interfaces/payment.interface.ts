export type PaymentStatus =
  'PENDING' | 'PROCESSING' | 'SUCCEEDED' | 'FAILED' | 'CANCELLED' | 'REFUNDED';

export type OrderStatus =
  | 'PAYMENT_PENDING'
  | 'PAYMENT_PROCESSING'
  | 'PAID'
  | 'COD_CONFIRMED'
  | 'PAYMENT_FAILED'
  | 'CANCELLED';

export type CheckoutPaymentMethod = 'CARD' | 'CASH_ON_DELIVERY';
export type DeliveryZone = 'DHAKA' | 'OUTSIDE_DHAKA';

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
  couponId: number | null;
  couponCode: string | null;
  paymentMethod: CheckoutPaymentMethod;
  deliveryZone: DeliveryZone;
  subtotalAmount: number;
  discountAmount: number;
  deliveryCharge: number;
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
  paymentIntentId: string;
  orderId: number;
  orderNumber: string;
  clientSecret: string;
  amount: number;
  currency: string;
  paymentStatus: PaymentStatus;
  paymentMethod: CheckoutPaymentMethod;
  deliveryZone: DeliveryZone;
  subtotalAmount: number;
  discountAmount: number;
  deliveryCharge: number;
  orderTotal: number;
  dueOnDelivery: number;
  items: OrderItemView[];
}

export interface CheckoutCustomer {
  id: number;
  name: string;
  email: string;
}

export interface CheckoutItemInput {
  productId: number;
  quantity: number;
}

export interface CheckoutOptions {
  paymentMethod: CheckoutPaymentMethod;
  deliveryZone: DeliveryZone;
  couponCode?: string;
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
  orderTotal: number;
  subtotalAmount: number;
  discountAmount: number;
  deliveryCharge: number;
  dueOnDelivery: number;
  paymentMethod: CheckoutPaymentMethod;
  deliveryZone: DeliveryZone;
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
