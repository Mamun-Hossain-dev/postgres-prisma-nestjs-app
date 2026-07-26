import { Module } from '@nestjs/common';
import { EmailConsumer } from './email.consumer';
import { EmailsService } from './emails.service';
import { emailTransporterProvider } from './providers/email-transporter.provider';

@Module({
  providers: [emailTransporterProvider, EmailsService, EmailConsumer],
  exports: [EmailsService],
})
export class EmailsModule {}
