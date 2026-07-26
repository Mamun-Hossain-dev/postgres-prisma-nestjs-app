import { Module } from '@nestjs/common';
import { EmailsModule } from '../modules/emails/emails.module';
import { WorkerConfigModule } from './worker-config.module';

@Module({
  imports: [WorkerConfigModule, EmailsModule],
})
export class EmailWorkerModule {}
