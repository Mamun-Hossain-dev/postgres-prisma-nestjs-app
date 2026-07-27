import { Inject, Injectable } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { firstValueFrom } from 'rxjs';
import { RabbitMqClients } from '../../../infrastructure/rabbitmq/constants/rabbitmq.constants';
import { UserEvents, type UserCreatedEvent } from './user.events';

@Injectable()
export class UserEventsPublisher {
  constructor(
    @Inject(RabbitMqClients.EMAILS)
    private readonly emailsClient: ClientProxy,
    @Inject(RabbitMqClients.NOTIFICATIONS)
    private readonly notificationsClient: ClientProxy,
    @Inject(RabbitMqClients.ANALYTICS)
    private readonly analyticsClient: ClientProxy,
  ) {}

  async publishCreated(user: UserCreatedEvent): Promise<void> {
    await Promise.all([
      firstValueFrom(this.emailsClient.emit(UserEvents.CREATED, user)),
      firstValueFrom(this.notificationsClient.emit(UserEvents.CREATED, user)),
      firstValueFrom(this.analyticsClient.emit(UserEvents.CREATED, user)),
    ]);
  }
}
