import { Module } from '@nestjs/common';
import { PaymentsModule } from '../payments/payments.module';
import { RefundController } from './refund.controller';
import { RefundService } from './refund.service';

@Module({
  imports: [PaymentsModule],
  controllers: [RefundController],
  providers: [RefundService],
})
export class RefundsModule {}
