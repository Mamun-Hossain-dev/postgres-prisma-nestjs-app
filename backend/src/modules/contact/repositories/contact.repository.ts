import type { RepositoryPaginatedResult } from '../../../common/interfaces/pagination.interface';
import type {
  ContactListOptions,
  ContactMessage,
  ContactStatus,
  CreateContactMessageInput,
} from '../interfaces/contact.interface';

export interface ContactRepository {
  create(input: CreateContactMessageInput): Promise<ContactMessage>;
  findAll(
    options: ContactListOptions,
  ): Promise<RepositoryPaginatedResult<ContactMessage>>;
  updateStatus(
    id: number,
    status: ContactStatus,
  ): Promise<ContactMessage | null>;
}
