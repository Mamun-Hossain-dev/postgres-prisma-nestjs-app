import { Inject, Injectable, Logger } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { firstValueFrom } from 'rxjs';
import { RabbitMqClients } from '../../../infrastructure/rabbitmq/constants/rabbitmq.constants';
import { AppException } from '../../../common/exceptions/app.exception';
import { RefundEvents } from './constants/refund.constants';
import type { RefundCompletedEvent } from './interfaces/refund.interface';

@Injectable()
export class RefundEventsPublisher {
  private readonly logger = new Logger(RefundEventsPublisher.name);

  constructor(
    @Inject(RabbitMqClients.EMAILS)
    private readonly emailsClient: ClientProxy,
    @Inject(RabbitMqClients.NOTIFICATIONS)
    private readonly notificationsClient: ClientProxy,
    @Inject(RabbitMqClients.ANALYTICS)
    private readonly analyticsClient: ClientProxy,
  ) {}

  async publishCompleted(event: RefundCompletedEvent): Promise<void> {
    const destinations = [
      ['email', this.emailsClient],
      ['notification', this.notificationsClient],
      ['analytics', this.analyticsClient],
    ] as const;
    const results = await Promise.allSettled(
      destinations.map(([, client]) =>
        Promise.resolve().then(() =>
          firstValueFrom(client.emit(RefundEvents.COMPLETED, event)),
        ),
      ),
    );
    const failures = results.flatMap((result, index) =>
      result.status === 'rejected'
        ? [
            {
              reason: result.reason as unknown,
              destination: destinations[index][0],
            },
          ]
        : [],
    );
    if (!failures.length) return;

    failures.forEach(({ reason, destination }) => {
      this.logger.error(
        `Could not publish refund event to ${destination}: ${String(reason)}`,
      );
    });
    throw new AppException('Refund completed but event delivery is pending', {
      code: 'REFUND_EVENT_PUBLISH_FAILED',
      status: 503,
    });
  }
}
