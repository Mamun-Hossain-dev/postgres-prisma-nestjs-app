import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../infrastructure/prisma/prisma.service';
import type {
  BroadcastWithDeliveries,
  CreateBroadcastInput,
  DeliveryStatus,
  NewsletterBroadcast,
  NewsletterSubscriber,
} from '../interfaces/newsletter.interface';
import {
  BroadcastStatus,
  DeliveryStatus as DeliveryStatuses,
  SubscriberStatus,
} from '../interfaces/newsletter.interface';
import type { NewsletterRepository } from './newsletter.repository';
import type { RepositoryPaginationOptions } from '../../../common/interfaces/pagination.interface';

@Injectable()
export class PrismaNewsletterRepository implements NewsletterRepository {
  constructor(private readonly prisma: PrismaService) {}

  subscribe(email: string, name?: string): Promise<NewsletterSubscriber> {
    return this.prisma.newsletterSubscriber.upsert({
      where: { email },
      create: { email, name },
      update: {
        name,
        status: SubscriberStatus.ACTIVE,
        subscribedAt: new Date(),
        unsubscribedAt: null,
      },
    });
  }

  async unsubscribe(email: string): Promise<NewsletterSubscriber | null> {
    const result = await this.prisma.newsletterSubscriber.updateMany({
      where: { email },
      data: {
        status: SubscriberStatus.UNSUBSCRIBED,
        unsubscribedAt: new Date(),
      },
    });
    if (!result.count) return null;
    return this.prisma.newsletterSubscriber.findUnique({ where: { email } });
  }

  async findSubscribers(options: RepositoryPaginationOptions) {
    const [data, totalItems] = await this.prisma.$transaction([
      this.prisma.newsletterSubscriber.findMany({
        skip: options.skip,
        take: options.take,
        orderBy: { subscribedAt: 'desc' },
      }),
      this.prisma.newsletterSubscriber.count(),
    ]);
    return { data, totalItems };
  }

  async findBroadcasts(options: RepositoryPaginationOptions) {
    const [data, totalItems] = await this.prisma.$transaction([
      this.prisma.newsletterBroadcast.findMany({
        skip: options.skip,
        take: options.take,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.newsletterBroadcast.count(),
    ]);
    return { data, totalItems };
  }

  async createBroadcast(
    input: CreateBroadcastInput,
  ): Promise<BroadcastWithDeliveries> {
    return this.prisma.$transaction(async (prisma) => {
      const subscribers = await prisma.newsletterSubscriber.findMany({
        where: { status: SubscriberStatus.ACTIVE },
        select: { email: true },
      });
      return prisma.newsletterBroadcast.create({
        data: {
          ...input,
          recipientCount: subscribers.length,
          deliveries: {
            create: subscribers.map(({ email }) => ({ email })),
          },
        },
        include: { deliveries: true },
      });
    });
  }

  async updateDelivery(
    id: number,
    status: DeliveryStatus,
    error?: string,
  ): Promise<void> {
    await this.prisma.newsletterDelivery.update({
      where: { id },
      data: {
        status,
        error,
        sentAt: status === DeliveryStatuses.SENT ? new Date() : null,
      },
    });
  }

  async completeBroadcast(id: number): Promise<NewsletterBroadcast> {
    const [sentCount, failedCount] = await Promise.all([
      this.prisma.newsletterDelivery.count({
        where: { broadcastId: id, status: DeliveryStatuses.SENT },
      }),
      this.prisma.newsletterDelivery.count({
        where: { broadcastId: id, status: DeliveryStatuses.FAILED },
      }),
    ]);
    const status =
      failedCount === 0
        ? BroadcastStatus.SENT
        : sentCount === 0
          ? BroadcastStatus.FAILED
          : BroadcastStatus.PARTIAL;

    return this.prisma.newsletterBroadcast.update({
      where: { id },
      data: {
        status,
        sentCount,
        failedCount,
        sentAt: new Date(),
      },
    });
  }
}
