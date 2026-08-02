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
import { PaymentRpcClient } from './rpc/payment-rpc.client';
import { PaymentRpcController } from './rpc/payment-rpc.controller';

@Module({
  imports: [RedisModule, RabbitMqModule],
  controllers: [PaymentController, PaymentRpcController],
  providers: [
    PaymentService,
    PaymentWebhookService,
    PaymentEventsPublisher,
    PrismaPaymentRepository,
    StripeService,
    PaymentRpcClient,
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
