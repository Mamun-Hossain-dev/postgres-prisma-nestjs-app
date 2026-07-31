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
import { EmailsService } from './emails.service';
import {
  PaymentEvents,
  PaymentConsumerNames,
} from '../payments/constants/payment.constants';
import type { PaymentSucceededEvent } from '../payments/interfaces/payment.interface';
import { EventProcessingService } from '../event-processing/event-processing.service';
import { InvoiceService } from '../orders/invoices/invoice.service';

@Controller()
export class EmailConsumer {
  private readonly logger = new Logger(EmailConsumer.name);

  constructor(
    private readonly emailsService: EmailsService,
    private readonly retryService: RabbitMqRetryService,
    private readonly eventProcessing: EventProcessingService,
    private readonly invoiceService: InvoiceService,
  ) {}

  @EventPattern(UserEvents.CREATED_EMAIL)
  async handleUserCreated(
    @Payload() user: UserCreatedEvent,
    @Ctx() context: RmqContext,
  ): Promise<void> {
    const channel = context.getChannelRef() as RabbitMqChannel;
    const message = context.getMessage() as RabbitMqMessage;

    try {
      await this.emailsService.sendWelcomeEmail(user.email, user.name);
      channel.ack(message);
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      this.logger.error(
        `Welcome email failed for ${user.email}: ${errorMessage}`,
      );
      await this.retryService.handleFailure(
        context,
        RabbitMqQueues.EMAILS,
        error,
      );
    }
  }

  @EventPattern(PaymentEvents.SUCCEEDED_EMAIL)
  async handlePaymentSucceeded(
    @Payload() event: PaymentSucceededEvent,
    @Ctx() context: RmqContext,
  ): Promise<void> {
    const channel = context.getChannelRef() as RabbitMqChannel;
    const message = context.getMessage() as RabbitMqMessage;
    const consumer = PaymentConsumerNames.EMAIL;

    try {
      const claimed = await this.eventProcessing.claim(consumer, event.eventId);
      if (!claimed) {
        channel.ack(message);
        return;
      }
      const invoice = await this.invoiceService.generate(event);
      await this.emailsService.sendPaymentConfirmation(event, invoice);
      await this.eventProcessing.complete(consumer, event.eventId);
      channel.ack(message);
    } catch (error) {
      await this.eventProcessing.release(consumer, event.eventId);
      await this.retryService.handleFailure(
        context,
        RabbitMqQueues.EMAILS,
        error,
      );
    }
  }
}
