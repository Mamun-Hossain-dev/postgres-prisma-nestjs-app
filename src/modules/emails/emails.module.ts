import { Module } from '@nestjs/common';
import { EmailListener } from './email.listener';
import { EmailsService } from './emails.service';
import { emailTransporterProvider } from './providers/email-transporter.provider';

@Module({
  providers: [emailTransporterProvider, EmailsService, EmailListener],
  exports: [EmailsService],
})
export class EmailsModule {}
