import { Injectable, Logger } from '@nestjs/common';
import { Ctx, EventPattern, Payload, RmqContext } from '@nestjs/microservices';
import { acknowledgeMessage } from '../../infrastructure/rabbitmq/rabbitmq-message.util';
import { UserEvents } from '../users/events/user.events';
import type { UserCreatedEvent } from '../users/events/user.events';

@Injectable()
export class NotificationConsumer {
  private readonly logger = new Logger(NotificationConsumer.name);

  @EventPattern(UserEvents.CREATED)
  handleUserCreated(
    @Payload() user: UserCreatedEvent,
    @Ctx() context: RmqContext,
  ): void {
    this.logger.log(`Notification event received for user ${user.id}`);
    acknowledgeMessage(context);
  }
}
