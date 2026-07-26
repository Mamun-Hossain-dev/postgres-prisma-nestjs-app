import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ClientsModule } from '@nestjs/microservices';
import { RABBITMQ_CLIENT } from './constants/rabbitmq.constants';
import { createRabbitMqPublisherOptions } from './rabbitmq.options';

@Module({
  imports: [
    ClientsModule.registerAsync([
      {
        name: RABBITMQ_CLIENT,
        inject: [ConfigService],
        useFactory: createRabbitMqPublisherOptions,
      },
    ]),
  ],
  exports: [ClientsModule],
})
export class RabbitMqModule {}
