export const RabbitMqQueues = {
  EMAILS: 'user.events.emails',
  NOTIFICATIONS: 'user.events.notifications',
  ANALYTICS: 'user.events.analytics',
} as const;

export const RabbitMqClients = {
  EMAILS: Symbol('RABBITMQ_EMAILS_CLIENT'),
  NOTIFICATIONS: Symbol('RABBITMQ_NOTIFICATIONS_CLIENT'),
  ANALYTICS: Symbol('RABBITMQ_ANALYTICS_CLIENT'),
} as const;
