import { Module } from '@nestjs/common';
import { AnalyticsModule } from '../modules/analytics/analytics.module';
import { WorkerConfigModule } from './worker-config.module';

@Module({
  imports: [WorkerConfigModule, AnalyticsModule],
})
export class AnalyticsWorkerModule {}
