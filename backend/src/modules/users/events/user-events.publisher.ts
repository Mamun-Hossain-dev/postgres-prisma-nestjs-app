import { Inject, Injectable, Logger } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { firstValueFrom } from 'rxjs';
import { RabbitMqClients } from '../../../infrastructure/rabbitmq/constants/rabbitmq.constants';
import { UserEvents, type UserCreatedEvent } from './user.events';

@Injectable()
export class UserEventsPublisher {
  private readonly logger = new Logger(UserEventsPublisher.name);

  constructor(
    @Inject(RabbitMqClients.EMAILS)
    private readonly emailsClient: ClientProxy,
    @Inject(RabbitMqClients.NOTIFICATIONS)
    private readonly notificationsClient: ClientProxy,
    @Inject(RabbitMqClients.ANALYTICS)
    private readonly analyticsClient: ClientProxy,
  ) {}

  async publishCreated(event: UserCreatedEvent): Promise<void> {
    const publishes = [
      [
        'emails',
        () =>
          firstValueFrom(
            this.emailsClient.emit(UserEvents.CREATED_EMAIL, event),
          ),
      ],
      [
        'notifications',
        () =>
          firstValueFrom(
            this.notificationsClient.emit(
              UserEvents.CREATED_NOTIFICATION,
              event,
            ),
          ),
      ],
      [
        'analytics',
        () =>
          firstValueFrom(
            this.analyticsClient.emit(UserEvents.CREATED_ANALYTICS, event),
          ),
      ],
    ] as const;

    const results = await Promise.allSettled(
      publishes.map(([, publish]) => Promise.resolve().then(publish)),
    );

    results.forEach((result, index) => {
      if (result.status === 'fulfilled') return;

      const destination = publishes[index][0];
      const error =
        result.reason instanceof Error
          ? result.reason
          : new Error(String(result.reason));
      this.logger.error(
        `Failed to publish user-created event to ${destination}: ${error.message}`,
        error.stack,
      );
    });
  }
}
