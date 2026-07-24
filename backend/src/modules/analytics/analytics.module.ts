import { Module } from '@nestjs/common';
import { AnalyticsListener } from './analytics.listener';

@Module({
  providers: [AnalyticsListener],
})
export class AnalyticsModule {}
