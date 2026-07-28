import { Controller, Logger } from '@nestjs/common';
import { Ctx, EventPattern, Payload, RmqContext } from '@nestjs/microservices';
import type { RabbitMqChannel } from '../../infrastructure/rabbitmq/interfaces/rabbitmq-channel.interface';
import { UserEvents } from '../users/events/user.events';
import type { UserCreatedEvent } from '../users/events/user.events';
import { EmailsService } from './emails.service';

@Controller()
export class EmailConsumer {
  private readonly logger = new Logger(EmailConsumer.name);

  constructor(private readonly emailsService: EmailsService) {}

  @EventPattern(UserEvents.CREATED_EMAIL)
  async handleUserCreated(
    @Payload() user: UserCreatedEvent,
    @Ctx() context: RmqContext,
  ): Promise<void> {
    const channel = context.getChannelRef() as RabbitMqChannel;
    const message: unknown = context.getMessage();

    try {
      await this.emailsService.sendWelcomeEmail(user.email, user.name);
      channel.ack(message);
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      this.logger.error(
        `Welcome email failed for ${user.email}: ${errorMessage}`,
      );
      channel.nack(message, false, false);
    }
  }
}
