export interface ConsumerIdempotencyRepository {
  claim(consumer: string, eventId: string): Promise<boolean>;
  complete(consumer: string, eventId: string): Promise<void>;
  release(consumer: string, eventId: string): Promise<void>;
}
