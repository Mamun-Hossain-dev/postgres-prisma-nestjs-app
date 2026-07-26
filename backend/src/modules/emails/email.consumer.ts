import { Injectable, Logger } from '@nestjs/common';
import { Ctx, EventPattern, Payload, RmqContext } from '@nestjs/microservices';
import {
  acknowledgeMessage,
  retryMessage,
} from '../../infrastructure/rabbitmq/rabbitmq-message.util';
import { UserEvents } from '../users/events/user.events';
import type { UserCreatedEvent } from '../users/events/user.events';
import { EmailsService } from './emails.service';

@Injectable()
export class EmailConsumer {
  private readonly logger = new Logger(EmailConsumer.name);

  constructor(private readonly emailsService: EmailsService) {}

  @EventPattern(UserEvents.CREATED)
  async handleUserCreated(
    @Payload() user: UserCreatedEvent,
    @Ctx() context: RmqContext,
  ): Promise<void> {
    try {
      await this.emailsService.sendWelcomeEmail(user.email, user.name);
      acknowledgeMessage(context);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      this.logger.error(`Welcome email failed for ${user.email}: ${message}`);
      retryMessage(context);
    }
  }
}
