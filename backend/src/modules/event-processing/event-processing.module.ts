import { Module } from '@nestjs/common';
import { CONSUMER_IDEMPOTENCY_REPOSITORY } from './constants/event-processing.tokens';
import { EventProcessingService } from './event-processing.service';
import { PrismaConsumerIdempotencyRepository } from './repositories/prisma-consumer-idempotency.repository';

@Module({
  providers: [
    EventProcessingService,
    PrismaConsumerIdempotencyRepository,
    {
      provide: CONSUMER_IDEMPOTENCY_REPOSITORY,
      useExisting: PrismaConsumerIdempotencyRepository,
    },
  ],
  exports: [EventProcessingService],
})
export class EventProcessingModule {}
