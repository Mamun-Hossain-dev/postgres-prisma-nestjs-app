import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ClientsModule, Transport } from '@nestjs/microservices';
import {
  RabbitMqClients,
  RabbitMqQueues,
} from './constants/rabbitmq.constants';
import { RabbitMqRetryService } from './rabbitmq-retry.service';

const clients = [
  [RabbitMqClients.PAYMENTS, RabbitMqQueues.PAYMENTS],
  [RabbitMqClients.EMAILS, RabbitMqQueues.EMAILS],
  [RabbitMqClients.NOTIFICATIONS, RabbitMqQueues.NOTIFICATIONS],
  [RabbitMqClients.ANALYTICS, RabbitMqQueues.ANALYTICS],
] as const;

@Module({
  imports: [
    ClientsModule.registerAsync(
      clients.map(([name, queue]) => ({
        name,
        imports: [ConfigModule],
        inject: [ConfigService],
        useFactory: (configService: ConfigService) => ({
          transport: Transport.RMQ,
          options: {
            urls: [configService.getOrThrow<string>('rabbitmq.url')],
            queue,
            queueOptions: { durable: true },
            persistent: true,
          },
        }),
      })),
    ),
  ],
  providers: [RabbitMqRetryService],
  exports: [ClientsModule, RabbitMqRetryService],
})
export class RabbitMqModule {}
