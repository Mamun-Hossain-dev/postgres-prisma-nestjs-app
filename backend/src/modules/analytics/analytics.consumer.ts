import { Injectable, Logger } from '@nestjs/common';
import { Ctx, EventPattern, Payload, RmqContext } from '@nestjs/microservices';
import { acknowledgeMessage } from '../../infrastructure/rabbitmq/rabbitmq-message.util';
import { UserEvents } from '../users/events/user.events';
import type { UserCreatedEvent } from '../users/events/user.events';

@Injectable()
export class AnalyticsConsumer {
  private readonly logger = new Logger(AnalyticsConsumer.name);

  @EventPattern(UserEvents.CREATED)
  handleUserCreated(
    @Payload() user: UserCreatedEvent,
    @Ctx() context: RmqContext,
  ): void {
    this.logger.log(`Analytics event received for user ${user.id}`);
    acknowledgeMessage(context);
  }
}
