import { Controller, Logger } from '@nestjs/common';
import { Ctx, EventPattern, Payload, RmqContext } from '@nestjs/microservices';
import { RabbitMqQueues } from '../../infrastructure/rabbitmq/constants/rabbitmq.constants';
import type {
  RabbitMqChannel,
  RabbitMqMessage,
} from '../../infrastructure/rabbitmq/interfaces/rabbitmq-channel.interface';
import { acknowledgeRabbitMqMessage } from '../../infrastructure/rabbitmq/rabbitmq-ack.util';
import { RabbitMqRetryService } from '../../infrastructure/rabbitmq/rabbitmq-retry.service';
import { UserEvents } from '../users/events/user.events';
import type { UserCreatedEvent } from '../users/events/user.events';
import { EventProcessingService } from '../event-processing/event-processing.service';
import {
  PaymentConsumerNames,
  PaymentEvents,
} from '../payments/constants/payment.constants';
import type { PaymentSucceededEvent } from '../payments/interfaces/payment.interface';
import {
  RefundConsumerNames,
  RefundEvents,
} from '../payments/refunds/constants/refund.constants';
import type { RefundCompletedEvent } from '../payments/refunds/interfaces/refund.interface';

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
      acknowledgeRabbitMqMessage(channel, message);
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
        acknowledgeRabbitMqMessage(channel, message);
        return;
      }
      this.logger.log(`Payment analytics event for order ${event.orderId}`);
      await this.eventProcessing.complete(consumer, event.eventId);
      acknowledgeRabbitMqMessage(channel, message);
    } catch (error) {
      try {
        await this.eventProcessing.release(consumer, event.eventId);
      } catch (releaseError) {
        this.logger.error(
          `Could not release analytics event claim ${event.eventId}: ${releaseError instanceof Error ? releaseError.message : String(releaseError)}`,
        );
      }
      await this.retryService.handleFailure(
        context,
        RabbitMqQueues.ANALYTICS,
        error,
      );
    }
  }

  @EventPattern(RefundEvents.COMPLETED)
  async handleRefundCompleted(
    @Payload() event: RefundCompletedEvent,
    @Ctx() context: RmqContext,
  ): Promise<void> {
    const channel = context.getChannelRef() as RabbitMqChannel;
    const message = context.getMessage() as RabbitMqMessage;
    const consumer = RefundConsumerNames.ANALYTICS;
    try {
      const claimed = await this.eventProcessing.claim(consumer, event.eventId);
      if (!claimed) {
        acknowledgeRabbitMqMessage(channel, message);
        return;
      }
      this.logger.log(
        `Refund analytics event for payment ${event.paymentId}, amount ${event.amount}`,
      );
      await this.eventProcessing.complete(consumer, event.eventId);
      acknowledgeRabbitMqMessage(channel, message);
    } catch (error) {
      try {
        await this.eventProcessing.release(consumer, event.eventId);
      } catch (releaseError) {
        this.logger.error(
          `Could not release refund analytics event claim ${event.eventId}: ${releaseError instanceof Error ? releaseError.message : String(releaseError)}`,
        );
      }
      await this.retryService.handleFailure(
        context,
        RabbitMqQueues.ANALYTICS,
        error,
      );
    }
  }
}
