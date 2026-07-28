import { Logger } from '@nestjs/common';
import type { RmqContext } from '@nestjs/microservices';
import {
  getRabbitMqDeadLetterQueue,
  getRabbitMqRetryQueue,
  RabbitMqQueues,
  RabbitMqRetryDelays,
} from './constants/rabbitmq.constants';
import { RabbitMqRetryService } from './rabbitmq-retry.service';

describe('RabbitMqRetryService', () => {
  function createChannel() {
    return {
      assertQueue: jest.fn().mockResolvedValue(undefined),
      sendToQueue: jest.fn().mockResolvedValue(true),
      ack: jest.fn(),
      nack: jest.fn(),
    };
  }

  function createMessage(retryAttempt?: number) {
    return {
      content: Buffer.from(
        JSON.stringify({ pattern: 'user.created.email', data: { id: 1 } }),
      ),
      properties: {
        headers:
          retryAttempt === undefined
            ? { traceId: 'trace-1' }
            : { traceId: 'trace-1', 'x-retry-attempt': retryAttempt },
      },
    };
  }

  function createContext(channel: unknown, message: unknown): RmqContext {
    return {
      getChannelRef: () => channel,
      getMessage: () => message,
    } as unknown as RmqContext;
  }

  beforeEach(() => {
    jest.spyOn(Logger.prototype, 'warn').mockImplementation(() => undefined);
    jest.spyOn(Logger.prototype, 'error').mockImplementation(() => undefined);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('schedules the first retry after 30 seconds and acknowledges the source message', async () => {
    const channel = createChannel();
    const message = createMessage();
    const context = createContext(channel, message);
    const service = new RabbitMqRetryService();

    await service.handleFailure(
      context,
      RabbitMqQueues.EMAILS,
      new Error('SMTP offline'),
    );

    expect(channel.assertQueue).toHaveBeenCalledWith(
      getRabbitMqRetryQueue(RabbitMqQueues.EMAILS, 1),
      {
        durable: true,
        arguments: {
          'x-message-ttl': 30_000,
          'x-dead-letter-exchange': '',
          'x-dead-letter-routing-key': RabbitMqQueues.EMAILS,
        },
      },
    );
    expect(channel.sendToQueue).toHaveBeenCalledWith(
      getRabbitMqRetryQueue(RabbitMqQueues.EMAILS, 1),
      message.content,
      {
        persistent: true,
        headers: {
          traceId: 'trace-1',
          'x-retry-attempt': 1,
          'x-last-error': 'SMTP offline',
        },
      },
    );
    expect(channel.ack).toHaveBeenCalledWith(message);
    expect(channel.nack).not.toHaveBeenCalled();
  });

  it.each(
    RabbitMqRetryDelays.map((delay, index) => ({
      currentAttempt: index,
      nextAttempt: index + 1,
      delay,
    })),
  )(
    'uses $delay ms before retry $nextAttempt',
    async ({ currentAttempt, nextAttempt, delay }) => {
      const channel = createChannel();
      const message = createMessage(currentAttempt);
      const service = new RabbitMqRetryService();

      await service.handleFailure(
        createContext(channel, message),
        RabbitMqQueues.EMAILS,
        new Error('failed'),
      );

      expect(channel.assertQueue).toHaveBeenCalledWith(
        getRabbitMqRetryQueue(RabbitMqQueues.EMAILS, nextAttempt),
        {
          durable: true,
          arguments: {
            'x-message-ttl': delay,
            'x-dead-letter-exchange': '',
            'x-dead-letter-routing-key': RabbitMqQueues.EMAILS,
          },
        },
      );
    },
  );

  it('moves a message to the DLQ when the fifth retry fails', async () => {
    const channel = createChannel();
    const message = createMessage(5);
    const context = createContext(channel, message);
    const service = new RabbitMqRetryService();

    await service.handleFailure(
      context,
      RabbitMqQueues.EMAILS,
      new Error('Still offline'),
    );

    const deadLetterQueue = getRabbitMqDeadLetterQueue(RabbitMqQueues.EMAILS);
    expect(channel.assertQueue).toHaveBeenCalledWith(deadLetterQueue, {
      durable: true,
    });
    expect(channel.sendToQueue).toHaveBeenCalledWith(
      deadLetterQueue,
      message.content,
      {
        persistent: true,
        headers: {
          traceId: 'trace-1',
          'x-retry-attempt': 5,
          'x-last-error': 'Still offline',
        },
      },
    );
    expect(channel.ack).toHaveBeenCalledWith(message);
    expect(channel.nack).not.toHaveBeenCalled();
  });

  it('requeues the source message when routing to a retry queue fails', async () => {
    const channel = createChannel();
    channel.sendToQueue.mockRejectedValue(new Error('RabbitMQ channel closed'));
    const message = createMessage();
    const service = new RabbitMqRetryService();

    await service.handleFailure(
      createContext(channel, message),
      RabbitMqQueues.EMAILS,
      new Error('SMTP offline'),
    );

    expect(channel.ack).not.toHaveBeenCalled();
    expect(channel.nack).toHaveBeenCalledWith(message, false, true);
  });
});
