export const PAYMENT_REPOSITORY = Symbol('PAYMENT_REPOSITORY');

export const PaymentEvents = {
  SUCCEEDED_EMAIL: 'payment.succeeded.email',
  SUCCEEDED_NOTIFICATION: 'payment.succeeded.notification',
  SUCCEEDED_ANALYTICS: 'payment.succeeded.analytics',
} as const;

export const PaymentConsumerNames = {
  EMAIL: 'payment-email',
  NOTIFICATION: 'payment-notification',
  ANALYTICS: 'payment-analytics',
} as const;

export const ACTIVE_PAYMENT_STATUSES = ['PENDING', 'PROCESSING'] as const;
