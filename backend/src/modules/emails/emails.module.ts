import { Module } from '@nestjs/common';
import { EmailConsumer } from './email.consumer';
import { EmailsService } from './emails.service';
import { emailTransporterProvider } from './providers/email-transporter.provider';
import { RabbitMqModule } from '../../infrastructure/rabbitmq/rabbitmq.module';

@Module({
  imports: [RabbitMqModule],
  providers: [emailTransporterProvider, EmailsService, EmailConsumer],
  exports: [EmailsService],
})
export class EmailsModule {}
