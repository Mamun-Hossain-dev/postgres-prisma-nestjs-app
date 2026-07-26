import { Inject, Injectable } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { firstValueFrom } from 'rxjs';
import { RABBITMQ_CLIENT } from '../../../infrastructure/rabbitmq/constants/rabbitmq.constants';
import { UserEvents, type UserCreatedEvent } from './user.events';

@Injectable()
export class UserEventsPublisher {
  constructor(
    @Inject(RABBITMQ_CLIENT)
    private readonly rabbitMqClient: ClientProxy,
  ) {}

  async publishCreated(user: UserCreatedEvent): Promise<void> {
    await firstValueFrom(
      this.rabbitMqClient.emit<UserCreatedEvent>(UserEvents.CREATED, user),
    );
  }
}
