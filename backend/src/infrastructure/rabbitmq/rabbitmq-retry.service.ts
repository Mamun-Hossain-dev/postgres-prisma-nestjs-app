import { Injectable, Logger } from '@nestjs/common';
import { RmqContext } from '@nestjs/microservices';
import {
  getRabbitMqDeadLetterQueue,
  getRabbitMqRetryQueue,
  RabbitMqRetryDelays,
} from './constants/rabbitmq.constants';
import type {
  RabbitMqChannel,
  RabbitMqMessage,
} from './interfaces/rabbitmq-channel.interface';

const RETRY_ATTEMPT_HEADER = 'x-retry-attempt';
const LAST_ERROR_HEADER = 'x-last-error';

@Injectable()
export class RabbitMqRetryService {
  private readonly logger = new Logger(RabbitMqRetryService.name);

  async handleFailure(
    context: RmqContext,
    sourceQueue: string,
    error: unknown,
  ): Promise<void> {
    const channel = context.getChannelRef() as RabbitMqChannel;
    const message = context.getMessage() as RabbitMqMessage;
    const currentAttempt = this.getRetryAttempt(message);
    const errorMessage = error instanceof Error ? error.message : String(error);

    try {
      if (currentAttempt < RabbitMqRetryDelays.length) {
        await this.scheduleRetry(
          channel,
          message,
          sourceQueue,
          currentAttempt,
          errorMessage,
        );
        return;
      }

      await this.moveToDeadLetterQueue(
        channel,
        message,
        sourceQueue,
        currentAttempt,
        errorMessage,
      );
    } catch (retryError) {
      const retryErrorMessage =
        retryError instanceof Error ? retryError.message : String(retryError);
      this.logger.error(
        `Could not route failed message from ${sourceQueue}: ${retryErrorMessage}`,
      );
      channel.nack(message, false, true);
    }
  }

  private async scheduleRetry(
    channel: RabbitMqChannel,
    message: RabbitMqMessage,
    sourceQueue: string,
    currentAttempt: number,
    errorMessage: string,
  ): Promise<void> {
    const nextAttempt = currentAttempt + 1;
    const delay = RabbitMqRetryDelays[currentAttempt];
    const retryQueue = getRabbitMqRetryQueue(sourceQueue, nextAttempt);

    await channel.assertQueue(retryQueue, {
      durable: true,
      arguments: {
        'x-message-ttl': delay,
        'x-dead-letter-exchange': '',
        'x-dead-letter-routing-key': sourceQueue,
      },
    });
    await channel.sendToQueue(retryQueue, message.content, {
      persistent: true,
      headers: this.buildHeaders(message, nextAttempt, errorMessage),
    });
    channel.ack(message);

    this.logger.warn(
      `Scheduled retry ${nextAttempt}/${RabbitMqRetryDelays.length} for ${sourceQueue} in ${delay}ms`,
    );
  }

  private async moveToDeadLetterQueue(
    channel: RabbitMqChannel,
    message: RabbitMqMessage,
    sourceQueue: string,
    currentAttempt: number,
    errorMessage: string,
  ): Promise<void> {
    const deadLetterQueue = getRabbitMqDeadLetterQueue(sourceQueue);

    await channel.assertQueue(deadLetterQueue, { durable: true });
    await channel.sendToQueue(deadLetterQueue, message.content, {
      persistent: true,
      headers: this.buildHeaders(message, currentAttempt, errorMessage),
    });
    channel.ack(message);

    this.logger.error(
      `Moved message from ${sourceQueue} to ${deadLetterQueue} after ${currentAttempt} retries`,
    );
  }

  private getRetryAttempt(message: RabbitMqMessage): number {
    const value = message.properties?.headers?.[RETRY_ATTEMPT_HEADER];
    const attempt = typeof value === 'number' ? value : Number(value);

    return Number.isInteger(attempt) && attempt >= 0 ? attempt : 0;
  }

  private buildHeaders(
    message: RabbitMqMessage,
    attempt: number,
    errorMessage: string,
  ): Record<string, unknown> {
    return {
      ...message.properties?.headers,
      [RETRY_ATTEMPT_HEADER]: attempt,
      [LAST_ERROR_HEADER]: errorMessage,
    };
  }
}
