import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../../infrastructure/prisma/prisma.service';
import type { ConsumerIdempotencyRepository } from './consumer-idempotency.repository';

@Injectable()
export class PrismaConsumerIdempotencyRepository implements ConsumerIdempotencyRepository {
  constructor(private readonly prisma: PrismaService) {}

  async claim(consumer: string, eventId: string): Promise<boolean> {
    try {
      await this.prisma.processedConsumerEvent.create({
        data: { consumer, eventId },
      });
      return true;
    } catch (error) {
      if (
        !(error instanceof Prisma.PrismaClientKnownRequestError) ||
        error.code !== 'P2002'
      ) {
        throw error;
      }
    }

    const staleBefore = new Date(Date.now() - 5 * 60_000);
    const reclaimed = await this.prisma.processedConsumerEvent.updateMany({
      where: {
        consumer,
        eventId,
        status: 'PROCESSING',
        updatedAt: { lt: staleBefore },
      },
      data: { updatedAt: new Date() },
    });
    return reclaimed.count === 1;
  }

  async complete(consumer: string, eventId: string): Promise<void> {
    await this.prisma.processedConsumerEvent.update({
      where: { consumer_eventId: { consumer, eventId } },
      data: { status: 'PROCESSED', processedAt: new Date() },
    });
  }

  async release(consumer: string, eventId: string): Promise<void> {
    await this.prisma.processedConsumerEvent.deleteMany({
      where: { consumer, eventId, status: 'PROCESSING' },
    });
  }
}
