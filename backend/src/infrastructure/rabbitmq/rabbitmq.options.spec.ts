import { Transport } from '@nestjs/microservices';
import type { ConfigService } from '@nestjs/config';
import { createRabbitMqOptions } from './rabbitmq.options';

describe('createRabbitMqOptions', () => {
  it('uses channel-scoped prefetch and explicit manual acknowledgements', () => {
    const config = {
      getOrThrow: jest.fn((key: string) => {
        if (key === 'rabbitmq.url') return 'amqp://localhost';
        if (key === 'rabbitmq.prefetchCount') return 10;
        throw new Error(`Unexpected config key: ${key}`);
      }),
    } as unknown as ConfigService;

    expect(createRabbitMqOptions(config, 'emails')).toEqual({
      transport: Transport.RMQ,
      options: {
        urls: ['amqp://localhost'],
        queue: 'emails',
        queueOptions: { durable: true },
        noAck: false,
        prefetchCount: 10,
        isGlobalPrefetchCount: false,
      },
    });
  });
});
