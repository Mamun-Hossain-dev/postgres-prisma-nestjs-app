import { Controller, Logger } from '@nestjs/common';
import { Ctx, EventPattern, Payload, RmqContext } from '@nestjs/microservices';
import { RabbitMqQueues } from '../../infrastructure/rabbitmq/constants/rabbitmq.constants';
import type {
  RabbitMqChannel,
  RabbitMqMessage,
} from '../../infrastructure/rabbitmq/interfaces/rabbitmq-channel.interface';
import { RabbitMqRetryService } from '../../infrastructure/rabbitmq/rabbitmq-retry.service';
import { UserEvents } from '../users/events/user.events';
import type { UserCreatedEvent } from '../users/events/user.events';
import { EventProcessingService } from '../event-processing/event-processing.service';
import {
  PaymentConsumerNames,
  PaymentEvents,
} from '../payments/constants/payment.constants';
import type { PaymentSucceededEvent } from '../payments/interfaces/payment.interface';

@Controller()
export class AnalyticsConsumer {
  private readonly logger = new Logger(AnalyticsConsumer.name);

  constructor(
    private readonly retryService: RabbitMqRetryService,
    private readonly eventProcessing: EventProcessingService,
  ) {}

  @EventPattern(UserEvents.CREATED_ANALYTICS)
  async handleUserCreated(
    @Payload() user: UserCreatedEvent,
    @Ctx() context: RmqContext,
  ): Promise<void> {
    const channel = context.getChannelRef() as RabbitMqChannel;
    const message = context.getMessage() as RabbitMqMessage;

    try {
      this.logger.log(`Analytics event received for user ${user.id}`);
      channel.ack(message);
    } catch (error) {
      await this.retryService.handleFailure(
        context,
        RabbitMqQueues.ANALYTICS,
        error,
      );
    }
  }

  @EventPattern(PaymentEvents.SUCCEEDED)
  async handlePaymentSucceeded(
    @Payload() event: PaymentSucceededEvent,
    @Ctx() context: RmqContext,
  ): Promise<void> {
    const channel = context.getChannelRef() as RabbitMqChannel;
    const message = context.getMessage() as RabbitMqMessage;
    const consumer = PaymentConsumerNames.ANALYTICS;
    try {
      const claimed = await this.eventProcessing.claim(consumer, event.eventId);
      if (!claimed) {
        channel.ack(message);
        return;
      }
      this.logger.log(`Payment analytics event for order ${event.orderId}`);
      await this.eventProcessing.complete(consumer, event.eventId);
      channel.ack(message);
    } catch (error) {
      await this.eventProcessing.release(consumer, event.eventId);
      await this.retryService.handleFailure(
        context,
        RabbitMqQueues.ANALYTICS,
        error,
      );
    }
  }
}
