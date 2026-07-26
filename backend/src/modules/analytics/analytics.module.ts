import { Module } from '@nestjs/common';
import { AnalyticsConsumer } from './analytics.consumer';
import { RabbitMqModule } from '../../infrastructure/rabbitmq/rabbitmq.module';

@Module({
  imports: [RabbitMqModule],
  providers: [AnalyticsConsumer],
})
export class AnalyticsModule {}
