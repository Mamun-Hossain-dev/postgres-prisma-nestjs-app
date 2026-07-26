import { Module } from '@nestjs/common';
import { AnalyticsConsumer } from './analytics.consumer';

@Module({
  providers: [AnalyticsConsumer],
})
export class AnalyticsModule {}
