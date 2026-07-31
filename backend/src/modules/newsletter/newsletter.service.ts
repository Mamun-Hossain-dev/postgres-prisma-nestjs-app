import { Inject, Injectable } from '@nestjs/common';
import type {
  PaginatedResult,
  PaginationOptions,
} from '../../common/interfaces/pagination.interface';
import {
  toPaginatedResult,
  toRepositoryPagination,
} from '../../common/utils/pagination.util';
import { EmailsService } from '../emails/emails.service';
import { NEWSLETTER_REPOSITORY } from './constants/newsletter.tokens';
import type {
  CreateBroadcastInput,
  NewsletterBroadcast,
  NewsletterSubscriber,
} from './interfaces/newsletter.interface';
import { DeliveryStatus } from './interfaces/newsletter.interface';
import type { NewsletterRepository } from './repositories/newsletter.repository';

@Injectable()
export class NewsletterService {
  constructor(
    @Inject(NEWSLETTER_REPOSITORY)
    private readonly repository: NewsletterRepository,
    private readonly emailsService: EmailsService,
  ) {}

  subscribe(email: string, name?: string): Promise<NewsletterSubscriber> {
    return this.repository.subscribe(
      email.trim().toLowerCase(),
      name?.trim() || undefined,
    );
  }

  unsubscribe(email: string): Promise<NewsletterSubscriber | null> {
    return this.repository.unsubscribe(email.trim().toLowerCase());
  }

  async findSubscribers(
    options: PaginationOptions,
  ): Promise<PaginatedResult<NewsletterSubscriber>> {
    return toPaginatedResult(
      await this.repository.findSubscribers(toRepositoryPagination(options)),
      options,
    );
  }

  async findBroadcasts(
    options: PaginationOptions,
  ): Promise<PaginatedResult<NewsletterBroadcast>> {
    return toPaginatedResult(
      await this.repository.findBroadcasts(toRepositoryPagination(options)),
      options,
    );
  }

  async broadcast(input: CreateBroadcastInput): Promise<NewsletterBroadcast> {
    const broadcast = await this.repository.createBroadcast({
      subject: input.subject.trim(),
      previewText: input.previewText?.trim() || undefined,
      content: input.content.trim(),
    });

    for (let index = 0; index < broadcast.deliveries.length; index += 25) {
      const batch = broadcast.deliveries.slice(index, index + 25);
      await Promise.all(
        batch.map(async (delivery) => {
          try {
            await this.emailsService.sendNewsletterEmail(
              delivery.email,
              broadcast.subject,
              broadcast.content,
              broadcast.previewText ?? undefined,
            );
            await this.repository.updateDelivery(
              delivery.id,
              DeliveryStatus.SENT,
            );
          } catch (error) {
            await this.repository.updateDelivery(
              delivery.id,
              DeliveryStatus.FAILED,
              error instanceof Error
                ? error.message.slice(0, 500)
                : 'Unknown delivery error',
            );
          }
        }),
      );
    }

    return this.repository.completeBroadcast(broadcast.id);
  }
}
