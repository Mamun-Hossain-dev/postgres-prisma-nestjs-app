import { Module } from '@nestjs/common';
import { RabbitMqModule } from '../../infrastructure/rabbitmq/rabbitmq.module';
import { AnalyticsConsumer } from './analytics.consumer';
import { EventProcessingModule } from '../event-processing/event-processing.module';

@Module({
  imports: [RabbitMqModule, EventProcessingModule],
  controllers: [AnalyticsConsumer],
})
export class AnalyticsModule {}
