import { Module } from '@nestjs/common';
import { AnalyticsConsumer } from './analytics.consumer';

@Module({
  controllers: [AnalyticsConsumer],
})
export class AnalyticsModule {}
