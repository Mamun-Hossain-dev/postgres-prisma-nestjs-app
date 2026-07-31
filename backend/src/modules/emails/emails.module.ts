import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import emailConfig from '../../config/email.config';
import { EmailConsumer } from './email.consumer';
import { EmailsService } from './emails.service';
import { emailTransporterProvider } from './providers/email-transporter.provider';
import { RabbitMqModule } from '../../infrastructure/rabbitmq/rabbitmq.module';
import { EventProcessingModule } from '../event-processing/event-processing.module';
import { OrdersModule } from '../orders/orders.module';

@Module({
  imports: [
    ConfigModule.forFeature(emailConfig),
    RabbitMqModule,
    EventProcessingModule,
    OrdersModule,
  ],
  controllers: [EmailConsumer],
  providers: [emailTransporterProvider, EmailsService],
  exports: [EmailsService],
})
export class EmailsModule {}
