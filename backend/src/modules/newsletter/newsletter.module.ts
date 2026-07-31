import { Module } from '@nestjs/common';
import { EmailsModule } from '../emails/emails.module';
import { NEWSLETTER_REPOSITORY } from './constants/newsletter.tokens';
import { NewsletterController } from './newsletter.controller';
import { NewsletterService } from './newsletter.service';
import { PrismaNewsletterRepository } from './repositories/prisma-newsletter.repository';

@Module({
  imports: [EmailsModule],
  controllers: [NewsletterController],
  providers: [
    NewsletterService,
    PrismaNewsletterRepository,
    {
      provide: NEWSLETTER_REPOSITORY,
      useExisting: PrismaNewsletterRepository,
    },
  ],
})
export class NewsletterModule {}
