import type { ConfigService } from '@nestjs/config';
import type { RedisService } from '../../infrastructure/redis/redis.service';
import type { PaymentGateway } from './gateways/payment-gateway.interface';
import { PaymentGatewayError } from './gateways/payment-gateway.interface';
import type { PaymentView } from './interfaces/payment.interface';
import { PaymentService } from './payment.service';
import type { PaymentRepository } from './repositories/payment.repository';

const payment: PaymentView = {
  id: 1,
  orderId: 2,
  status: 'PENDING',
  amount: 125_000,
  currency: 'bdt',
  idempotencyKey: '9cf8ed35-c195-49af-a2f1-e747d802b023',
  providerIntentId: 'pi_123',
  failureCode: null,
  failureMessage: null,
  paidAt: null,
  createdAt: new Date(),
  updatedAt: new Date(),
  order: {
    id: 2,
    orderNumber: 'DD-TEST',
    userId: 7,
    customerName: 'Test User',
    customerEmail: 'test@example.com',
    totalAmount: 125_000,
    currency: 'bdt',
    status: 'PAYMENT_PENDING',
    paidAt: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    items: [],
  },
};

describe('PaymentService', () => {
  const repository = {
    findByIdempotencyKey: jest.fn(),
    findActiveByUser: jest.fn(),
    findOwnedById: jest.fn(),
    createPendingFromCart: jest.fn(),
    attachProviderIntent: jest.fn(),
    markCreationFailed: jest.fn(),
  } as unknown as jest.Mocked<PaymentRepository>;
  const gateway = {
    createPaymentIntent: jest.fn(),
    retrievePaymentIntent: jest.fn(),
  } as unknown as jest.Mocked<PaymentGateway>;
  const redis = {
    ready: true,
    acquireLock: jest.fn(),
    releaseLock: jest.fn(),
  } as unknown as jest.Mocked<RedisService>;
  const config = {
    getOrThrow: jest.fn((key: string) => {
      if (key === 'stripe.currency') return 'bdt';
      if (key === 'stripe.minorUnit') return 100;
      return 30;
    }),
  } as unknown as ConfigService;
  const user = {
    id: 7,
    name: 'Test User',
    email: 'test@example.com',
  } as never;

  beforeEach(() => jest.clearAllMocks());

  it('returns the existing Stripe intent for an idempotent retry', async () => {
    repository.findByIdempotencyKey.mockResolvedValue(payment);
    gateway.retrievePaymentIntent.mockResolvedValue({
      id: 'pi_123',
      clientSecret: 'secret',
      status: 'requires_payment_method',
    });
    const service = new PaymentService(repository, gateway, redis, config);

    await expect(
      service.createCheckout(user, payment.idempotencyKey),
    ).resolves.toMatchObject({ paymentId: 1, clientSecret: 'secret' });
    // eslint-disable-next-line @typescript-eslint/unbound-method
    expect(redis.acquireLock).not.toHaveBeenCalled();
    // eslint-disable-next-line @typescript-eslint/unbound-method
    expect(gateway.createPaymentIntent).not.toHaveBeenCalled();
  });

  it('fails safely when the distributed lock cannot be acquired', async () => {
    repository.findByIdempotencyKey.mockResolvedValue(null);
    redis.acquireLock.mockResolvedValue(false);
    const service = new PaymentService(repository, gateway, redis, config);

    await expect(
      service.createCheckout(user, payment.idempotencyKey),
    ).rejects.toMatchObject({ code: 'CHECKOUT_ALREADY_IN_PROGRESS' });
  });

  it('marks the payment failed when Stripe intent creation fails', async () => {
    repository.findByIdempotencyKey.mockResolvedValue(null);
    repository.findActiveByUser.mockResolvedValue(null);
    repository.createPendingFromCart.mockResolvedValue({
      ...payment,
      providerIntentId: null,
    });
    redis.acquireLock.mockResolvedValue(true);
    redis.releaseLock.mockResolvedValue(true);
    gateway.createPaymentIntent.mockRejectedValue(
      new PaymentGatewayError('Stripe unavailable', 'STRIPE_ERROR'),
    );
    const service = new PaymentService(repository, gateway, redis, config);

    await expect(
      service.createCheckout(user, payment.idempotencyKey),
    ).rejects.toMatchObject({ code: 'STRIPE_ERROR' });
    // eslint-disable-next-line @typescript-eslint/unbound-method
    expect(repository.markCreationFailed).toHaveBeenCalledWith(
      payment.id,
      'STRIPE_ERROR',
      'Stripe unavailable',
    );
    // eslint-disable-next-line @typescript-eslint/unbound-method
    expect(redis.releaseLock).toHaveBeenCalled();
  });
});
