import { Injectable, Logger, OnApplicationBootstrap } from '@nestjs/common';
import { RabbitMqQueues } from '../../infrastructure/rabbitmq/constants/rabbitmq.constants';
import { RabbitMqService } from '../../infrastructure/rabbitmq/rabbitmq.service';
import { UserEvents } from '../users/events/user.events';
import type { UserCreatedEvent } from '../users/events/user.events';
import { EmailsService } from './emails.service';

@Injectable()
export class EmailConsumer implements OnApplicationBootstrap {
  private readonly logger = new Logger(EmailConsumer.name);

  constructor(
    private readonly emailsService: EmailsService,
    private readonly rabbitMqService: RabbitMqService,
  ) {}

  async onApplicationBootstrap(): Promise<void> {
    await this.rabbitMqService.consume(
      RabbitMqQueues.EMAILS,
      UserEvents.CREATED,
      (user: UserCreatedEvent) => this.handleUserCreated(user),
    );
  }

  async handleUserCreated(user: UserCreatedEvent): Promise<void> {
    try {
      await this.emailsService.sendWelcomeEmail(user.email, user.name);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      this.logger.error(`Welcome email failed for ${user.email}: ${message}`);
      throw error;
    }
  }
}
