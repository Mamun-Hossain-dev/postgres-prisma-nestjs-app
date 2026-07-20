import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { UserEvents } from '../users/events/user.events';
import type { UserCreatedEvent } from '../users/events/user.events';

@Injectable()
export class EmailListener {
  private readonly logger = new Logger(EmailListener.name);

  @OnEvent(UserEvents.CREATED)
  handleUserCreated(user: UserCreatedEvent): void {
    this.logger.log(`Email event received for ${user.email}`);
  }
}
