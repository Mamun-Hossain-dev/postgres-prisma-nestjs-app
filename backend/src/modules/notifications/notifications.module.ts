import { Module } from '@nestjs/common';
import { NotificationConsumer } from './notification.consumer';
import { RabbitMqModule } from '../../infrastructure/rabbitmq/rabbitmq.module';

@Module({
  imports: [RabbitMqModule],
  providers: [NotificationConsumer],
})
export class NotificationsModule {}
