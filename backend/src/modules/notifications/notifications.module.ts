import { Module } from '@nestjs/common';
import { RabbitMqModule } from '../../infrastructure/rabbitmq/rabbitmq.module';
import { NotificationConsumer } from './notification.consumer';

@Module({
  imports: [RabbitMqModule],
  controllers: [NotificationConsumer],
})
export class NotificationsModule {}
