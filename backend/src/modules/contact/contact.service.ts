import { Inject, Injectable } from '@nestjs/common';
import { AppException } from '../../common/exceptions/app.exception';
import type {
  PaginatedResult,
  PaginationOptions,
} from '../../common/interfaces/pagination.interface';
import {
  toPaginatedResult,
  toRepositoryPagination,
} from '../../common/utils/pagination.util';
import { CONTACT_REPOSITORY } from './constants/contact.tokens';
import type {
  ContactListOptions,
  ContactMessage,
  ContactStatus,
  CreateContactMessageInput,
} from './interfaces/contact.interface';
import type { ContactRepository } from './repositories/contact.repository';

@Injectable()
export class ContactService {
  constructor(
    @Inject(CONTACT_REPOSITORY)
    private readonly repository: ContactRepository,
  ) {}

  create(input: CreateContactMessageInput): Promise<ContactMessage> {
    return this.repository.create({
      name: input.name.trim(),
      email: input.email.trim().toLowerCase(),
      subject: input.subject.trim(),
      message: input.message.trim(),
    });
  }

  async findAll(
    options: PaginationOptions & Omit<ContactListOptions, 'skip' | 'take'>,
  ): Promise<PaginatedResult<ContactMessage>> {
    const result = await this.repository.findAll({
      ...toRepositoryPagination(options),
      status: options.status,
      search: options.search?.trim(),
    });
    return toPaginatedResult(result, options);
  }

  async updateStatus(
    id: number,
    status: ContactStatus,
  ): Promise<ContactMessage> {
    const message = await this.repository.updateStatus(id, status);
    if (!message) {
      throw new AppException('Contact message not found', {
        code: 'CONTACT_MESSAGE_NOT_FOUND',
        status: 404,
      });
    }
    return message;
  }
}
