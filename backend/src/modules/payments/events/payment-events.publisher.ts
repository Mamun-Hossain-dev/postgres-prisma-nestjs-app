import { Inject, Injectable, Logger } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { firstValueFrom } from 'rxjs';
import { RabbitMqClients } from '../../../infrastructure/rabbitmq/constants/rabbitmq.constants';
import { AppException } from '../../../common/exceptions/app.exception';
import { PaymentEvents } from '../constants/payment.constants';
import type { PaymentSucceededEvent } from '../interfaces/payment.interface';

@Injectable()
export class PaymentEventsPublisher {
  private readonly logger = new Logger(PaymentEventsPublisher.name);

  constructor(
    @Inject(RabbitMqClients.EMAILS)
    private readonly emailsClient: ClientProxy,
    @Inject(RabbitMqClients.NOTIFICATIONS)
    private readonly notificationsClient: ClientProxy,
    @Inject(RabbitMqClients.ANALYTICS)
    private readonly analyticsClient: ClientProxy,
  ) {}

  async publishSucceeded(event: PaymentSucceededEvent): Promise<void> {
    const destinations = [
      ['email', this.emailsClient],
      ['notification', this.notificationsClient],
      ['analytics', this.analyticsClient],
    ] as const;
    const results = await Promise.allSettled(
      destinations.map(([, client]) =>
        Promise.resolve().then(() =>
          firstValueFrom(client.emit(PaymentEvents.SUCCEEDED, event)),
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
        `Could not publish payment event to ${destination}: ${String(reason)}`,
      );
    });
    throw new AppException('Payment completed but event delivery is pending', {
      code: 'PAYMENT_EVENT_PUBLISH_FAILED',
      status: 503,
    });
  }
}
