import type {
  RepositoryPaginatedResult,
  RepositoryPaginationOptions,
} from '../../../common/interfaces/pagination.interface';
import type {
  BroadcastWithDeliveries,
  CreateBroadcastInput,
  DeliveryStatus,
  NewsletterBroadcast,
  NewsletterSubscriber,
} from '../interfaces/newsletter.interface';

export interface NewsletterRepository {
  subscribe(email: string, name?: string): Promise<NewsletterSubscriber>;
  unsubscribe(email: string): Promise<NewsletterSubscriber | null>;
  findSubscribers(
    options: RepositoryPaginationOptions,
  ): Promise<RepositoryPaginatedResult<NewsletterSubscriber>>;
  findBroadcasts(
    options: RepositoryPaginationOptions,
  ): Promise<RepositoryPaginatedResult<NewsletterBroadcast>>;
  createBroadcast(
    input: CreateBroadcastInput,
  ): Promise<BroadcastWithDeliveries>;
  updateDelivery(
    id: number,
    status: DeliveryStatus,
    error?: string,
  ): Promise<void>;
  completeBroadcast(id: number): Promise<NewsletterBroadcast>;
}
