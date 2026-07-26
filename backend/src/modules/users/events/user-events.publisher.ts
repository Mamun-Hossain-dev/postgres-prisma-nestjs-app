import { Injectable } from '@nestjs/common';
import { RabbitMqService } from '../../../infrastructure/rabbitmq/rabbitmq.service';
import { UserEvents, type UserCreatedEvent } from './user.events';

@Injectable()
export class UserEventsPublisher {
  constructor(private readonly rabbitMqService: RabbitMqService) {}

  async publishCreated(user: UserCreatedEvent): Promise<void> {
    await this.rabbitMqService.publish(UserEvents.CREATED, user);
  }
}
