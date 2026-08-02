export const PAYMENT_REPOSITORY = Symbol('PAYMENT_REPOSITORY');

export const PaymentCommands = {
  PROCESS: 'process.payment',
} as const;

export const PaymentEvents = {
  SUCCEEDED: 'payment.succeeded',
} as const;

export const PaymentConsumerNames = {
  EMAIL: 'payment-email',
  NOTIFICATION: 'payment-notification',
  ANALYTICS: 'payment-analytics',
} as const;

export const ACTIVE_PAYMENT_STATUSES = ['PENDING', 'PROCESSING'] as const;
