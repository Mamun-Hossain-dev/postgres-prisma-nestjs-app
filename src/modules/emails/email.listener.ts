import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { UserEvents } from '../users/events/user.events';
import type { UserCreatedEvent } from '../users/events/user.events';
import { EmailsService } from './emails.service';

@Injectable()
export class EmailListener {
  private readonly logger = new Logger(EmailListener.name);

  constructor(private readonly emailsService: EmailsService) {}

  @OnEvent(UserEvents.CREATED, { async: true })
  async handleUserCreated(user: UserCreatedEvent): Promise<void> {
    try {
      await this.emailsService.sendWelcomeEmail(user.email, user.name);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      this.logger.error(`Welcome email failed for ${user.email}: ${message}`);
    }
  }
}
