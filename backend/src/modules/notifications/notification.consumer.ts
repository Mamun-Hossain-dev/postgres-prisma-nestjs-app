import { Controller, Logger } from '@nestjs/common';
import { Ctx, EventPattern, Payload, RmqContext } from '@nestjs/microservices';
import type { RabbitMqChannel } from '../../infrastructure/rabbitmq/interfaces/rabbitmq-channel.interface';
import { UserEvents } from '../users/events/user.events';
import type { UserCreatedEvent } from '../users/events/user.events';

@Controller()
export class NotificationConsumer {
  private readonly logger = new Logger(NotificationConsumer.name);

  @EventPattern(UserEvents.CREATED_NOTIFICATION)
  handleUserCreated(
    @Payload() user: UserCreatedEvent,
    @Ctx() context: RmqContext,
  ): void {
    this.logger.log(`Notification event received for user ${user.id}`);
    const channel = context.getChannelRef() as RabbitMqChannel;
    const message: unknown = context.getMessage();
    channel.ack(message);
  }
}
