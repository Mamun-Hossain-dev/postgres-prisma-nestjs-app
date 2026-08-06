import { Module } from '@nestjs/common';
import { PaymentsModule } from '../payments/payments.module';
import { REFUND_REQUEST_REPOSITORY } from './constants/refund-request.tokens';
import { PrismaRefundRequestRepository } from './repositories/prisma-refund-request.repository';
import { RefundRequestController } from './refund-request.controller';
import { RefundRequestService } from './refund-request.service';

@Module({
  imports: [PaymentsModule],
  controllers: [RefundRequestController],
  providers: [
    RefundRequestService,
    PrismaRefundRequestRepository,
    {
      provide: REFUND_REQUEST_REPOSITORY,
      useExisting: PrismaRefundRequestRepository,
    },
  ],
})
export class RefundRequestsModule {}
