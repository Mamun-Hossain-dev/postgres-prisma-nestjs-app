import { Module } from '@nestjs/common';
import { CONTACT_REPOSITORY } from './constants/contact.tokens';
import { ContactController } from './contact.controller';
import { ContactService } from './contact.service';
import { PrismaContactRepository } from './repositories/prisma-contact.repository';

@Module({
  controllers: [ContactController],
  providers: [
    ContactService,
    PrismaContactRepository,
    {
      provide: CONTACT_REPOSITORY,
      useExisting: PrismaContactRepository,
    },
  ],
})
export class ContactModule {}
