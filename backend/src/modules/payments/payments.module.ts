import { Module } from '@nestjs/common';
import { RedisModule } from '../../infrastructure/redis/redis.module';
import { RabbitMqModule } from '../../infrastructure/rabbitmq/rabbitmq.module';
import { PAYMENT_REPOSITORY } from './constants/payment.constants';
import { PaymentEventsPublisher } from './events/payment-events.publisher';
import { PaymentGateway } from './gateways/payment-gateway.interface';
import { StripeService } from './gateways/stripe.service';
import { PaymentController } from './payment.controller';
import { PaymentService } from './payment.service';
import { PaymentWebhookService } from './payment-webhook.service';
import { PrismaPaymentRepository } from './repositories/prisma-payment.repository';

@Module({
  imports: [RedisModule, RabbitMqModule],
  controllers: [PaymentController],
  providers: [
    PaymentService,
    PaymentWebhookService,
    PaymentEventsPublisher,
    PrismaPaymentRepository,
    StripeService,
    {
      provide: PAYMENT_REPOSITORY,
      useExisting: PrismaPaymentRepository,
    },
    {
      provide: PaymentGateway,
      useExisting: StripeService,
    },
  ],
  exports: [PaymentService],
})
export class PaymentsModule {}
