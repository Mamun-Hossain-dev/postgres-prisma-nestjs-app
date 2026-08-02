import { Module } from '@nestjs/common';
import { RabbitMqModule } from '../../infrastructure/rabbitmq/rabbitmq.module';
import { NotificationConsumer } from './notification.consumer';
import { EventProcessingModule } from '../event-processing/event-processing.module';
import { AccountModule } from '../account/account.module';

@Module({
  imports: [RabbitMqModule, EventProcessingModule, AccountModule],
  controllers: [NotificationConsumer],
})
export class NotificationsModule {}
