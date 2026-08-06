import { randomUUID } from 'node:crypto';
import { Inject, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AppException } from '../../common/exceptions/app.exception';
import { RedisService } from '../../infrastructure/redis/redis.service';
import { PaymentService } from '../payments/payment.service';
import { REFUND_REQUEST_REPOSITORY } from './constants/refund-request.tokens';
import type {
  RefundRequestListQuery,
  RefundRequestListResult,
  RefundRequestView,
} from './interfaces/refund-request.interface';
import type { RefundRequestRepository } from './repositories/refund-request.repository';

@Injectable()
export class RefundRequestService {
  private readonly logger = new Logger(RefundRequestService.name);
  private readonly lockTtlSeconds: number;

  constructor(
    @Inject(REFUND_REQUEST_REPOSITORY)
    private readonly repository: RefundRequestRepository,
    private readonly paymentService: PaymentService,
    private readonly redis: RedisService,
    configService: ConfigService,
  ) {
    this.lockTtlSeconds = configService.getOrThrow<number>(
      'stripe.paymentLockTtlSeconds',
    );
  }

  findAllForUser(
    userId: number,
    query: RefundRequestListQuery,
  ): Promise<RefundRequestListResult> {
    return this.repository.findAllForUser(userId, query);
  }

  findAllForAdmin(
    query: RefundRequestListQuery,
  ): Promise<RefundRequestListResult> {
    return this.repository.findAllForAdmin(query);
  }

  async findOne(userId: number, requestId: number): Promise<RefundRequestView> {
    const request = await this.repository.findOwnedById(userId, requestId);
    if (!request) throw this.requestNotFound();
    return request;
  }

  async findOneForAdmin(requestId: number): Promise<RefundRequestView> {
    const request = await this.repository.findById(requestId);
    if (!request) throw this.requestNotFound();
    return request;
  }

  async request(
    userId: number,
    orderId: number,
    reason: string,
  ): Promise<RefundRequestView> {
    const eligible = await this.repository.findRefundableOrder(userId, orderId);
    if (!eligible) throw this.orderNotFound();
    if (!eligible.refundable) {
      throw new AppException(
        'Only paid orders with a captured payment can be refunded',
        { code: 'REFUND_PAYMENT_NOT_SUCCESSFUL', status: 409 },
      );
    }

    if (!this.redis.ready) throw this.lockUnavailable();
    const lockKey = `refund-request:create:${orderId}`;
    const lockToken = randomUUID();
    let acquired = false;
    try {
      acquired = await this.redis.acquireLock(
        lockKey,
        lockToken,
        this.lockTtlSeconds,
      );
    } catch {
      throw this.lockUnavailable();
    }
    if (!acquired) throw this.requestInProgress();

    try {
      const existing = await this.repository.findActiveForOrder(orderId);
      if (existing) {
        if (existing.status === 'PENDING') throw this.alreadyPending();
        throw this.alreadyProcessed();
      }
      return await this.repository.create(userId, orderId, reason.trim());
    } finally {
      await this.releaseLock(lockKey, lockToken);
    }
  }

  async approve(
    adminId: number,
    requestId: number,
    note?: string,
    amount?: number,
  ): Promise<RefundRequestView> {
    if (!this.redis.ready) throw this.lockUnavailable();
    const lockKey = `refund-request:approve:${requestId}`;
    const lockToken = randomUUID();
    let acquired = false;
    try {
      acquired = await this.redis.acquireLock(
        lockKey,
        lockToken,
        this.lockTtlSeconds,
      );
    } catch {
      throw this.lockUnavailable();
    }
    if (!acquired) throw this.requestInProgress();

    try {
      const request = await this.repository.findById(requestId);
      if (!request) throw this.requestNotFound();
      if (request.status !== 'PENDING') throw this.requestNotPending();

      const payment = await this.paymentService.getRefundablePaymentForOrder(
        request.orderId,
      );
      if (!payment) throw this.refundUnavailable();

      const refund = await this.paymentService.requestRefund(
        payment.id,
        adminId,
        amount,
        request.reason,
        randomUUID(),
      );
      const approved = await this.repository.approve(
        requestId,
        adminId,
        refund.id,
        note?.trim() || null,
      );
      if (!approved) throw this.requestNotPending();
      return approved;
    } finally {
      await this.releaseLock(lockKey, lockToken);
    }
  }

  async deny(
    adminId: number,
    requestId: number,
    note?: string,
  ): Promise<RefundRequestView> {
    const request = await this.repository.findById(requestId);
    if (!request) throw this.requestNotFound();
    const denied = await this.repository.deny(
      requestId,
      adminId,
      note?.trim() || null,
    );
    if (!denied) throw this.requestNotPending();
    return denied;
  }

  private async releaseLock(lockKey: string, lockToken: string): Promise<void> {
    try {
      const released = await this.redis.releaseLock(lockKey, lockToken);
      if (!released)
        this.logger.warn(`Refund request lock expired: ${lockKey}`);
    } catch {
      this.logger.warn(`Refund request lock was not released: ${lockKey}`);
    }
  }

  private requestNotFound() {
    return new AppException('Refund request not found', {
      code: 'REFUND_REQUEST_NOT_FOUND',
      status: 404,
    });
  }

  private orderNotFound() {
    return new AppException('Order not found', {
      code: 'ORDER_NOT_FOUND',
      status: 404,
    });
  }

  private requestNotPending() {
    return new AppException('Only pending refund requests can be decided', {
      code: 'REFUND_REQUEST_NOT_PENDING',
      status: 409,
    });
  }

  private alreadyPending() {
    return new AppException(
      'A refund request is already pending for this order',
      {
        code: 'REFUND_REQUEST_ALREADY_PENDING',
        status: 409,
      },
    );
  }

  private alreadyProcessed() {
    return new AppException('This order has already been reviewed', {
      code: 'REFUND_REQUEST_ALREADY_PROCESSED',
      status: 409,
    });
  }

  private requestInProgress() {
    return new AppException('This refund request is already being processed', {
      code: 'REFUND_REQUEST_IN_PROGRESS',
      status: 409,
    });
  }

  private lockUnavailable() {
    return new AppException('Refund requests are temporarily unavailable', {
      code: 'REFUND_LOCK_UNAVAILABLE',
      status: 503,
    });
  }

  private refundUnavailable() {
    return new AppException('This order cannot be refunded anymore', {
      code: 'REFUND_UNAVAILABLE',
      status: 409,
    });
  }
}
