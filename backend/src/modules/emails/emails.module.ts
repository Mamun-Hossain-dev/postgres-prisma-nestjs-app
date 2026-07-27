import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import emailConfig from '../../config/email.config';
import { EmailConsumer } from './email.consumer';
import { EmailsService } from './emails.service';
import { emailTransporterProvider } from './providers/email-transporter.provider';

@Module({
  imports: [ConfigModule.forFeature(emailConfig)],
  controllers: [EmailConsumer],
  providers: [emailTransporterProvider, EmailsService],
  exports: [EmailsService],
})
export class EmailsModule {}
