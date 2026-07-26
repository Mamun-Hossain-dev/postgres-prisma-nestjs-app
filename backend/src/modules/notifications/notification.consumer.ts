import { Injectable, Logger, OnApplicationBootstrap } from '@nestjs/common';
import { RabbitMqQueues } from '../../infrastructure/rabbitmq/constants/rabbitmq.constants';
import { RabbitMqService } from '../../infrastructure/rabbitmq/rabbitmq.service';
import { UserEvents } from '../users/events/user.events';
import type { UserCreatedEvent } from '../users/events/user.events';

@Injectable()
export class NotificationConsumer implements OnApplicationBootstrap {
  private readonly logger = new Logger(NotificationConsumer.name);

  constructor(private readonly rabbitMqService: RabbitMqService) {}

  async onApplicationBootstrap(): Promise<void> {
    await this.rabbitMqService.consume(
      RabbitMqQueues.NOTIFICATIONS,
      UserEvents.CREATED,
      (user: UserCreatedEvent) => this.handleUserCreated(user),
    );
  }

  handleUserCreated(user: UserCreatedEvent): void {
    this.logger.log(`Notification event received for user ${user.id}`);
  }
}
