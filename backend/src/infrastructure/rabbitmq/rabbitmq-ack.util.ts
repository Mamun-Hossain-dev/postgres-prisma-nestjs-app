import type {
  RabbitMqChannel,
  RabbitMqMessage,
} from './interfaces/rabbitmq-channel.interface';

const settledMessages = new WeakSet<object>();

export function acknowledgeRabbitMqMessage(
  channel: RabbitMqChannel,
  message: RabbitMqMessage,
): boolean {
  if (settledMessages.has(message)) {
    return false;
  }

  settledMessages.add(message);
  channel.ack(message);
  return true;
}

export function requeueRabbitMqMessage(
  channel: RabbitMqChannel,
  message: RabbitMqMessage,
): boolean {
  if (settledMessages.has(message)) {
    return false;
  }

  settledMessages.add(message);
  channel.nack(message, false, true);
  return true;
}
