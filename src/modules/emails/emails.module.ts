import { Module } from '@nestjs/common';
import { EmailListener } from './email.listener';

@Module({
  providers: [EmailListener],
})
export class EmailsModule {}
