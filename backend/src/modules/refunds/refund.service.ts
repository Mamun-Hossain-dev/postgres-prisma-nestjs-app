import { Inject, Injectable } from '@nestjs/common';
import { AppException } from '../../common/exceptions/app.exception';
import { REFUND_REPOSITORY } from '../payments/refunds/constants/refund.constants';
import type {
  RefundView,
  RefundListQuery,
  RefundListResult,
} from '../payments/refunds/interfaces/refund.interface';
import type { RefundRepository } from '../payments/refunds/repositories/refund.repository';
import { PaymentService } from '../payments/payment.service';

@Injectable()
export class RefundService {
  constructor(
    private readonly paymentService: PaymentService,
    @Inject(REFUND_REPOSITORY)
    private readonly repository: RefundRepository,
  ) {}

  requestRefund(
    requestedByUserId: number,
    paymentId: number,
    amount: number | undefined,
    reason: string | undefined,
    idempotencyKey: string,
  ): Promise<RefundView> {
    return this.paymentService.requestRefund(
      paymentId,
      requestedByUserId,
      amount,
      reason,
      idempotencyKey,
    );
  }

  findAll(query: RefundListQuery): Promise<RefundListResult> {
    return this.repository.findAll(query);
  }

  async findOne(id: number): Promise<RefundView> {
    const refund = await this.repository.findById(id);
    if (!refund) {
      throw new AppException('Refund not found', {
        code: 'REFUND_NOT_FOUND',
        status: 404,
      });
    }
    return refund;
  }
}
