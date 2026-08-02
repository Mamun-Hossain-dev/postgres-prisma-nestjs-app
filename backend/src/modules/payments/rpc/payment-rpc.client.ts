import { Inject, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ClientProxy } from '@nestjs/microservices';
import { firstValueFrom, timeout } from 'rxjs';
import { AppException } from '../../../common/exceptions/app.exception';
import { RabbitMqClients } from '../../../infrastructure/rabbitmq/constants/rabbitmq.constants';
import { PaymentCommands } from '../constants/payment.constants';
import type {
  PaymentRpcError,
  ProcessPaymentCommand,
  ProcessPaymentResult,
} from './payment-rpc.contract';

@Injectable()
export class PaymentRpcClient {
  private readonly timeoutMs: number;

  constructor(
    @Inject(RabbitMqClients.PAYMENTS)
    private readonly client: ClientProxy,
    configService: ConfigService,
  ) {
    this.timeoutMs = configService.getOrThrow<number>('rabbitmq.rpcTimeoutMs');
  }

  async process(command: ProcessPaymentCommand): Promise<ProcessPaymentResult> {
    try {
      return await firstValueFrom(
        this.client
          .send<ProcessPaymentResult, ProcessPaymentCommand>(
            PaymentCommands.PROCESS,
            command,
          )
          .pipe(timeout(this.timeoutMs)),
      );
    } catch (error) {
      const rpcError = this.getRpcError(error);
      throw new AppException(
        rpcError?.message ?? 'Checkout service is temporarily unavailable',
        {
          code: rpcError?.code ?? 'PAYMENT_RPC_UNAVAILABLE',
          status: rpcError?.status ?? 503,
          details: rpcError?.details,
          cause: error,
        },
      );
    }
  }

  private getRpcError(error: unknown): PaymentRpcError | null {
    if (!error || typeof error !== 'object') return null;
    const candidate = error as Record<string, unknown>;
    if (
      typeof candidate.code === 'string' &&
      typeof candidate.message === 'string' &&
      typeof candidate.status === 'number'
    ) {
      return candidate as unknown as PaymentRpcError;
    }
    const nestedMessage =
      typeof candidate.message === 'object' ? candidate.message : undefined;
    return this.getRpcError(
      candidate.error ?? candidate.response ?? nestedMessage,
    );
  }
}
