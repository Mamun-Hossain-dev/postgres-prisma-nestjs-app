import { Inject, Injectable } from '@nestjs/common';
import { CONSUMER_IDEMPOTENCY_REPOSITORY } from './constants/event-processing.tokens';
import type { ConsumerIdempotencyRepository } from './repositories/consumer-idempotency.repository';

@Injectable()
export class EventProcessingService {
  constructor(
    @Inject(CONSUMER_IDEMPOTENCY_REPOSITORY)
    private readonly repository: ConsumerIdempotencyRepository,
  ) {}

  claim(consumer: string, eventId: string): Promise<boolean> {
    return this.repository.claim(consumer, eventId);
  }

  complete(consumer: string, eventId: string): Promise<void> {
    return this.repository.complete(consumer, eventId);
  }

  release(consumer: string, eventId: string): Promise<void> {
    return this.repository.release(consumer, eventId);
  }
}
