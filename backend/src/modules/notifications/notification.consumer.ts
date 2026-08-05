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
import { AccountService } from '../account/account.service';

@Controller()
export class NotificationConsumer {
  private readonly logger = new Logger(NotificationConsumer.name);

  constructor(
    private readonly retryService: RabbitMqRetryService,
    private readonly eventProcessing: EventProcessingService,
    private readonly accountService: AccountService,
  ) {}

  @EventPattern(UserEvents.CREATED_NOTIFICATION)
  async handleUserCreated(
    @Payload() user: UserCreatedEvent,
    @Ctx() context: RmqContext,
  ): Promise<void> {
    const channel = context.getChannelRef() as RabbitMqChannel;
    const message = context.getMessage() as RabbitMqMessage;

    try {
      this.logger.log(`Notification event received for user ${user.id}`);
      await this.accountService.createNotification(user.id, {
        type: 'ACCOUNT',
        title: 'Welcome to DeviceDock',
        message: 'Your DeviceDock account is ready.',
      });
      acknowledgeRabbitMqMessage(channel, message);
    } catch (error) {
      await this.retryService.handleFailure(
        context,
        RabbitMqQueues.NOTIFICATIONS,
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
    const consumer = PaymentConsumerNames.NOTIFICATION;
    try {
      const claimed = await this.eventProcessing.claim(consumer, event.eventId);
      if (!claimed) {
        acknowledgeRabbitMqMessage(channel, message);
        return;
      }
      await this.accountService.createNotification(event.customer.id, {
        type: 'ORDER',
        title: `Order ${event.orderNumber} confirmed`,
        message:
          event.paymentMethod === 'CASH_ON_DELIVERY'
            ? 'Your card deposit was paid. The remaining balance is due on delivery.'
            : 'Your card payment was verified and your order is confirmed.',
      });
      this.logger.log(`Notification sent to user ${event.customer.id}`);
      await this.eventProcessing.complete(consumer, event.eventId);
      acknowledgeRabbitMqMessage(channel, message);
    } catch (error) {
      try {
        await this.eventProcessing.release(consumer, event.eventId);
      } catch (releaseError) {
        this.logger.error(
          `Could not release notification event claim ${event.eventId}: ${releaseError instanceof Error ? releaseError.message : String(releaseError)}`,
        );
      }
      await this.retryService.handleFailure(
        context,
        RabbitMqQueues.NOTIFICATIONS,
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
    const consumer = RefundConsumerNames.NOTIFICATION;
    try {
      const claimed = await this.eventProcessing.claim(consumer, event.eventId);
      if (!claimed) {
        acknowledgeRabbitMqMessage(channel, message);
        return;
      }
      this.logger.log(
        `Refund notification event for user ${event.customer.id}, order ${event.orderNumber}`,
      );
      await this.eventProcessing.complete(consumer, event.eventId);
      acknowledgeRabbitMqMessage(channel, message);
    } catch (error) {
      try {
        await this.eventProcessing.release(consumer, event.eventId);
      } catch (releaseError) {
        this.logger.error(
          `Could not release refund notification event claim ${event.eventId}: ${releaseError instanceof Error ? releaseError.message : String(releaseError)}`,
        );
      }
      await this.retryService.handleFailure(
        context,
        RabbitMqQueues.NOTIFICATIONS,
        error,
      );
    }
  }
}
