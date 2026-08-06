import { RefundRequestService } from './refund-request.service';
import type { RefundRequestRepository } from './repositories/refund-request.repository';
import type { PaymentService } from '../payments/payment.service';
import type { RedisService } from '../../infrastructure/redis/redis.service';
import type { ConfigService } from '@nestjs/config';

describe('RefundRequestService', () => {
  const repository = {
    create: jest.fn(),
    findById: jest.fn(),
    findOwnedById: jest.fn(),
    findActiveForOrder: jest.fn(),
    findRefundableOrder: jest.fn(),
    findAllForUser: jest.fn(),
    findAllForAdmin: jest.fn(),
    approve: jest.fn(),
    deny: jest.fn(),
  } as jest.Mocked<RefundRequestRepository>;
  const paymentService = {
    getRefundablePaymentForOrder: jest.fn(),
    requestRefund: jest.fn(),
  } as unknown as jest.Mocked<PaymentService>;
  const redis = {
    ready: true,
    acquireLock: jest.fn(),
    releaseLock: jest.fn(),
  } as unknown as jest.Mocked<RedisService>;
  const configService = {
    getOrThrow: jest.fn().mockReturnValue(10),
  } as unknown as jest.Mocked<ConfigService>;

  const pendingRequest = {
    id: 7,
    orderId: 4,
    userId: 1,
    reason: 'Item arrived damaged',
    status: 'PENDING',
    refundId: null,
    adminId: null,
    decisionNote: null,
    reviewedAt: null,
    order: { id: 4, orderNumber: 'DD-1', status: 'PAID', currency: 'BDT' },
    refund: null,
  } as never;

  beforeEach(() => {
    jest.clearAllMocks();
    redis.releaseLock.mockResolvedValue(true);
  });

  function createService() {
    return new RefundRequestService(
      repository,
      paymentService,
      redis,
      configService,
    );
  }

  it('rejects a refund request for an order the user does not own', async () => {
    repository.findRefundableOrder.mockResolvedValue(null);
    await expect(
      createService().request(1, 4, 'Item arrived damaged'),
    ).rejects.toMatchObject({ code: 'ORDER_NOT_FOUND' });
  });

  it('rejects a refund request when no captured payment exists', async () => {
    repository.findRefundableOrder.mockResolvedValue({
      orderId: 4,
      refundable: false,
    } as never);
    await expect(
      createService().request(1, 4, 'Item arrived damaged'),
    ).rejects.toMatchObject({ code: 'REFUND_PAYMENT_NOT_SUCCESSFUL' });
  });

  it('creates a refund request for a refundable order', async () => {
    repository.findRefundableOrder.mockResolvedValue({
      orderId: 4,
      refundable: true,
    } as never);
    repository.findActiveForOrder.mockResolvedValue(null);
    redis.acquireLock.mockResolvedValue(true);
    repository.create.mockResolvedValue(pendingRequest);

    await expect(
      createService().request(1, 4, 'Item arrived damaged'),
    ).resolves.toMatchObject({ id: 7 });
    // eslint-disable-next-line @typescript-eslint/unbound-method
    expect(repository.create).toHaveBeenCalledWith(
      1,
      4,
      'Item arrived damaged',
    );
    // eslint-disable-next-line @typescript-eslint/unbound-method
    expect(redis.releaseLock).toHaveBeenCalled();
  });

  it('rejects a second pending request for the same order', async () => {
    repository.findRefundableOrder.mockResolvedValue({
      orderId: 4,
      refundable: true,
    } as never);
    repository.findActiveForOrder.mockResolvedValue(pendingRequest);
    redis.acquireLock.mockResolvedValue(true);

    await expect(
      createService().request(1, 4, 'Item arrived damaged'),
    ).rejects.toMatchObject({ code: 'REFUND_REQUEST_ALREADY_PENDING' });
    // eslint-disable-next-line @typescript-eslint/unbound-method
    expect(repository.create).not.toHaveBeenCalled();
  });

  it('approves a pending request and executes the refund through the payment service', async () => {
    repository.findById.mockResolvedValue(pendingRequest);
    paymentService.getRefundablePaymentForOrder.mockResolvedValue({ id: 9 });
    paymentService.requestRefund.mockResolvedValue({
      id: 22,
      status: 'PENDING',
    });
    repository.approve.mockResolvedValue({
      ...pendingRequest,
      status: 'APPROVED',
      refundId: 22,
    } as never);
    redis.acquireLock.mockResolvedValue(true);

    await expect(createService().approve(2, 7)).resolves.toMatchObject({
      status: 'APPROVED',
    });
    // eslint-disable-next-line @typescript-eslint/unbound-method
    expect(paymentService.requestRefund).toHaveBeenCalledWith(
      9,
      2,
      undefined,
      'Item arrived damaged',
      expect.any(String),
    );
    // eslint-disable-next-line @typescript-eslint/unbound-method
    expect(repository.approve).toHaveBeenCalledWith(7, 2, 22, null);
  });

  it('approves with a partial amount and passes it to the payment service', async () => {
    repository.findById.mockResolvedValue(pendingRequest);
    paymentService.getRefundablePaymentForOrder.mockResolvedValue({ id: 9 });
    paymentService.requestRefund.mockResolvedValue({
      id: 23,
      status: 'PENDING',
    });
    repository.approve.mockResolvedValue({
      ...pendingRequest,
      status: 'APPROVED',
      refundId: 23,
    } as never);
    redis.acquireLock.mockResolvedValue(true);

    await expect(
      createService().approve(2, 7, 'Partial', 2500),
    ).resolves.toMatchObject({
      status: 'APPROVED',
    });
    // eslint-disable-next-line @typescript-eslint/unbound-method
    expect(paymentService.requestRefund).toHaveBeenCalledWith(
      9,
      2,
      2500,
      'Item arrived damaged',
      expect.any(String),
    );
    // eslint-disable-next-line @typescript-eslint/unbound-method
    expect(repository.approve).toHaveBeenCalledWith(7, 2, 23, 'Partial');
  });

  it('rejects approving a request that was already decided', async () => {
    repository.findById.mockResolvedValue({
      ...pendingRequest,
      status: 'DENIED',
    } as never);
    redis.acquireLock.mockResolvedValue(true);

    await expect(createService().approve(2, 7)).rejects.toMatchObject({
      code: 'REFUND_REQUEST_NOT_PENDING',
    });
    // eslint-disable-next-line @typescript-eslint/unbound-method
    expect(paymentService.requestRefund).not.toHaveBeenCalled();
  });

  it('rejects approving when the payment can no longer be refunded', async () => {
    repository.findById.mockResolvedValue(pendingRequest);
    paymentService.getRefundablePaymentForOrder.mockResolvedValue(null);
    redis.acquireLock.mockResolvedValue(true);

    await expect(createService().approve(2, 7)).rejects.toMatchObject({
      code: 'REFUND_UNAVAILABLE',
    });
    // eslint-disable-next-line @typescript-eslint/unbound-method
    expect(paymentService.requestRefund).not.toHaveBeenCalled();
  });

  it('denies a pending request with a note', async () => {
    repository.findById.mockResolvedValue(pendingRequest);
    repository.deny.mockResolvedValue({
      ...pendingRequest,
      status: 'DENIED',
    } as never);

    await expect(
      createService().deny(2, 7, 'Outside refund window'),
    ).resolves.toMatchObject({ status: 'DENIED' });
    // eslint-disable-next-line @typescript-eslint/unbound-method
    expect(repository.deny).toHaveBeenCalledWith(7, 2, 'Outside refund window');
  });

  it('rejects denying a request that was already decided', async () => {
    repository.findById.mockResolvedValue(pendingRequest);
    repository.deny.mockResolvedValue(null);

    await expect(createService().deny(2, 7)).rejects.toMatchObject({
      code: 'REFUND_REQUEST_NOT_PENDING',
    });
  });
});
