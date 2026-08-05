export const REFUND_REPOSITORY = Symbol('REFUND_REPOSITORY');

export const RefundEvents = {
  COMPLETED: 'refund.completed',
} as const;

export const RefundConsumerNames = {
  EMAIL: 'refund-email',
  NOTIFICATION: 'refund-notification',
  ANALYTICS: 'refund-analytics',
} as const;
