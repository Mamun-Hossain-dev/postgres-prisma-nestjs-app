import { Module } from '@nestjs/common';
import { RabbitMqModule } from '../../infrastructure/rabbitmq/rabbitmq.module';
import { AnalyticsConsumer } from './analytics.consumer';

@Module({
  imports: [RabbitMqModule],
  controllers: [AnalyticsConsumer],
})
export class AnalyticsModule {}
