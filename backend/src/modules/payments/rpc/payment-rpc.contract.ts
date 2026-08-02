import type {
  CheckoutCustomer,
  CheckoutItemInput,
  CheckoutOptions,
  CheckoutSession,
} from '../interfaces/payment.interface';

export interface ProcessPaymentCommand {
  customer: CheckoutCustomer;
  idempotencyKey: string;
  items: CheckoutItemInput[];
  options: CheckoutOptions;
}

export type ProcessPaymentResult = CheckoutSession;

export interface PaymentRpcError {
  code: string;
  message: string;
  status: number;
  details?: unknown;
}
