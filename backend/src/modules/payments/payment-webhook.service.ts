import { Injectable, Logger } from '@nestjs/common';
import { AppException } from '../../common/exceptions/app.exception';
import {
  type GatewayWebhookEvent,
  PaymentGateway,
  WebhookVerificationError,
} from './gateways/payment-gateway.interface';
import type { PaymentRepository } from './repositories/payment.repository';
import { Inject } from '@nestjs/common';
import { PAYMENT_REPOSITORY } from './constants/payment.constants';
import { PaymentEventsPublisher } from './events/payment-events.publisher';

@Injectable()
export class PaymentWebhookService {
  private readonly logger = new Logger(PaymentWebhookService.name);

  constructor(
    private readonly gateway: PaymentGateway,
    @Inject(PAYMENT_REPOSITORY)
    private readonly repository: PaymentRepository,
    private readonly eventsPublisher: PaymentEventsPublisher,
  ) {}

  async handle(rawBody: Buffer, signature: string): Promise<void> {
    let event: GatewayWebhookEvent;
    try {
      event = this.gateway.verifyWebhook(rawBody, signature);
    } catch (error) {
      if (error instanceof WebhookVerificationError) {
        throw new AppException(error.message, {
          code: 'INVALID_WEBHOOK_SIGNATURE',
          status: 400,
        });
      }
      throw error;
    }

    await this.handleVerified(event);
  }

  async handleVerified(event: GatewayWebhookEvent): Promise<void> {
    const result = await this.repository.processWebhook(event);
    if (result.duplicate) {
      this.logger.debug(`Duplicate Stripe event received: ${event.id}`);
    }
    if (result.succeededEvent) {
      await this.eventsPublisher.publishSucceeded(result.succeededEvent);
    }
  }
}
