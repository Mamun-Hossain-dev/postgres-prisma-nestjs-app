import { Module } from '@nestjs/common';
import { AnalyticsModule } from '../modules/analytics/analytics.module';
import { EmailsModule } from '../modules/emails/emails.module';
import { NotificationsModule } from '../modules/notifications/notifications.module';

@Module({
  imports: [EmailsModule],
})
export class EmailWorkerModule {}

@Module({
  imports: [NotificationsModule],
})
export class NotificationWorkerModule {}

@Module({
  imports: [AnalyticsModule],
})
export class AnalyticsWorkerModule {}
