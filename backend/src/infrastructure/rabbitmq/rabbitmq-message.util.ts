import type { RmqContext } from '@nestjs/microservices';
import type { Channel, ConsumeMessage } from 'amqplib';

export function acknowledgeMessage(context: RmqContext): void {
  const channel = context.getChannelRef() as Channel;
  channel.ack(context.getMessage() as ConsumeMessage);
}

export function retryMessage(context: RmqContext): void {
  const channel = context.getChannelRef() as Channel;
  channel.nack(context.getMessage() as ConsumeMessage, false, true);
}
