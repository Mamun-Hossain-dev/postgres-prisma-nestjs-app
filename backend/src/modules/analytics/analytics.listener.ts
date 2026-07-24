import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { UserEvents } from '../users/events/user.events';
import type { UserCreatedEvent } from '../users/events/user.events';

@Injectable()
export class AnalyticsListener {
  private readonly logger = new Logger(AnalyticsListener.name);

  @OnEvent(UserEvents.CREATED)
  handleUserCreated(user: UserCreatedEvent): void {
    this.logger.log(`Analytics event received for user ${user.id}`);
  }
}
