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

export const RabbitMqRetryDelays = [
  30_000,
  60_000,
  5 * 60_000,
  15 * 60_000,
  30 * 60_000,
] as const;

export function getRabbitMqRetryQueue(queue: string, attempt: number): string {
  return `${queue}.retry.${attempt}`;
}

export function getRabbitMqDeadLetterQueue(queue: string): string {
  return `${queue}.dlq`;
}
