import { ConfigService } from '@nestjs/config';
import { Transport, type RmqOptions } from '@nestjs/microservices';
import { RABBITMQ_USER_EXCHANGE } from './constants/rabbitmq.constants';

export function createRabbitMqPublisherOptions(
  configService: ConfigService,
): RmqOptions {
  return {
    transport: Transport.RMQ,
    options: {
      urls: [configService.getOrThrow<string>('rabbitmq.url')],
      exchange: RABBITMQ_USER_EXCHANGE,
      exchangeType: 'topic',
      wildcards: true,
      persistent: true,
    },
  };
}

export function createRabbitMqConsumerOptions(
  configService: ConfigService,
  queue: string,
  routingKey: string,
): RmqOptions {
  return {
    transport: Transport.RMQ,
    options: {
      urls: [configService.getOrThrow<string>('rabbitmq.url')],
      queue,
      exchange: RABBITMQ_USER_EXCHANGE,
      exchangeType: 'topic',
      routingKey,
      noAck: false,
      prefetchCount: configService.getOrThrow<number>('rabbitmq.prefetchCount'),
      queueOptions: {
        durable: true,
      },
    },
  };
}
