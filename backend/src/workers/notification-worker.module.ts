import { Module } from '@nestjs/common';
import { NotificationsModule } from '../modules/notifications/notifications.module';
import { WorkerConfigModule } from './worker-config.module';

@Module({
  imports: [WorkerConfigModule, NotificationsModule],
})
export class NotificationWorkerModule {}
