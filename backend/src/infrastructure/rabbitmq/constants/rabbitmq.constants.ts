export const RABBITMQ_CLIENT = Symbol('RABBITMQ_CLIENT');

export const RABBITMQ_USER_EXCHANGE = 'user.events';

export const RabbitMqQueues = {
  EMAILS: 'user.events.emails',
  NOTIFICATIONS: 'user.events.notifications',
  ANALYTICS: 'user.events.analytics',
} as const;
