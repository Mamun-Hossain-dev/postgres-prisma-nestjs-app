import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../infrastructure/prisma/prisma.service';
import type { ContactRepository } from './contact.repository';
import type {
  ContactListOptions,
  ContactMessage,
  ContactStatus,
  CreateContactMessageInput,
} from '../interfaces/contact.interface';

@Injectable()
export class PrismaContactRepository implements ContactRepository {
  constructor(private readonly prisma: PrismaService) {}

  create(input: CreateContactMessageInput): Promise<ContactMessage> {
    return this.prisma.contactMessage.create({ data: input });
  }

  async findAll(options: ContactListOptions) {
    const where = {
      ...(options.status ? { status: options.status } : {}),
      ...(options.search
        ? {
            OR: [
              {
                name: {
                  contains: options.search,
                  mode: 'insensitive' as const,
                },
              },
              {
                email: {
                  contains: options.search,
                  mode: 'insensitive' as const,
                },
              },
              {
                subject: {
                  contains: options.search,
                  mode: 'insensitive' as const,
                },
              },
            ],
          }
        : {}),
    };
    const [data, totalItems] = await this.prisma.$transaction([
      this.prisma.contactMessage.findMany({
        where,
        skip: options.skip,
        take: options.take,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.contactMessage.count({ where }),
    ]);
    return { data, totalItems };
  }

  async updateStatus(
    id: number,
    status: ContactStatus,
  ): Promise<ContactMessage | null> {
    const result = await this.prisma.contactMessage.updateMany({
      where: { id },
      data: { status },
    });
    if (!result.count) return null;
    return this.prisma.contactMessage.findUnique({ where: { id } });
  }
}
