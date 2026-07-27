import type { ConfigService } from '@nestjs/config';
import { type MicroserviceOptions, Transport } from '@nestjs/microservices';

export function createRabbitMqOptions(
  configService: ConfigService,
  queue: string,
): MicroserviceOptions {
  return {
    transport: Transport.RMQ,
    options: {
      urls: [configService.getOrThrow<string>('rabbitmq.url')],
      queue,
      queueOptions: { durable: true },
      noAck: false,
      prefetchCount: configService.getOrThrow<number>('rabbitmq.prefetchCount'),
    },
  };
}
