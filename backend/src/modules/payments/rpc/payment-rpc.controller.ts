import { Controller, Logger } from '@nestjs/common';
import {
  Ctx,
  MessagePattern,
  Payload,
  RmqContext,
  RpcException,
} from '@nestjs/microservices';
import { AppException } from '../../../common/exceptions/app.exception';
import type {
  RabbitMqChannel,
  RabbitMqMessage,
} from '../../../infrastructure/rabbitmq/interfaces/rabbitmq-channel.interface';
import { acknowledgeRabbitMqMessage } from '../../../infrastructure/rabbitmq/rabbitmq-ack.util';
import { PaymentCommands } from '../constants/payment.constants';
import { PaymentService } from '../payment.service';
import type {
  PaymentRpcError,
  ProcessPaymentCommand,
  ProcessPaymentResult,
} from './payment-rpc.contract';

@Controller()
export class PaymentRpcController {
  private readonly logger = new Logger(PaymentRpcController.name);

  constructor(private readonly paymentService: PaymentService) {}

  @MessagePattern(PaymentCommands.PROCESS)
  async processPayment(
    @Payload() command: ProcessPaymentCommand,
    @Ctx() context: RmqContext,
  ): Promise<ProcessPaymentResult> {
    try {
      const result = await this.paymentService.createCheckout(
        command.customer,
        command.idempotencyKey,
        command.items,
        command.options,
      );
      this.acknowledge(context);
      return result;
    } catch (error) {
      this.acknowledge(context);

      if (error instanceof AppException) {
        throw new RpcException({
          code: error.code,
          message: error.message,
          status: error.getStatus(),
          details: error.details,
        } satisfies PaymentRpcError);
      }

      this.logger.error(
        'Unexpected payment RPC failure',
        error instanceof Error ? error.stack : undefined,
      );
      throw new RpcException({
        code: 'PAYMENT_PROCESSING_FAILED',
        message: 'Payment processing failed',
        status: 500,
      } satisfies PaymentRpcError);
    }
  }

  private acknowledge(context: RmqContext): void {
    const channel = context.getChannelRef() as RabbitMqChannel;
    const message = context.getMessage() as RabbitMqMessage;
    acknowledgeRabbitMqMessage(channel, message);
  }
}
