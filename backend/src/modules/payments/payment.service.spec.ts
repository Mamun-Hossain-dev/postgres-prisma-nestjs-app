import type { ConfigService } from '@nestjs/config';
import type { RedisService } from '../../infrastructure/redis/redis.service';
import type { PaymentGateway } from './gateways/payment-gateway.interface';
import { PaymentGatewayError } from './gateways/payment-gateway.interface';
import type { PaymentView } from './interfaces/payment.interface';
import { PaymentService } from './payment.service';
import type { PaymentRepository } from './repositories/payment.repository';
import type { PaymentWebhookService } from './payment-webhook.service';

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
    customerPhone: '01700000000',
    deliveryAddressLine: 'House 1, Road 2',
    deliveryArea: 'Dhanmondi',
    deliveryCity: 'Dhaka',
    deliveryPostalCode: '1209',
    couponId: null,
    couponCode: null,
    paymentMethod: 'CARD',
    deliveryZone: 'DHAKA',
    subtotalAmount: 119_000,
    discountAmount: 0,
    deliveryCharge: 6_000,
    totalAmount: 125_000,
    currency: 'bdt',
    status: 'PAYMENT_PENDING',
    paidAt: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    items: [
      {
        id: 3,
        productId: 1,
        productTitle: 'Test product',
        productSku: 'TEST-1',
        unitAmount: 59_500,
        quantity: 2,
        totalAmount: 119_000,
      },
    ],
  },
};

const payableIntent = {
  id: 'pi_123',
  clientSecret: 'secret',
  status: 'requires_payment_method',
  amount: payment.amount,
  currency: payment.currency,
  metadata: { paymentId: String(payment.id) },
};

describe('PaymentService', () => {
  const repository = {
    findByIdempotencyKey: jest.fn(),
    findActiveByUser: jest.fn(),
    findByOrderId: jest.fn(),
    findOwnedById: jest.fn(),
    createPendingFromItems: jest.fn(),
    attachProviderIntent: jest.fn(),
    markCreationFailed: jest.fn(),
    markCancelled: jest.fn(),
    markRefundedAndCancel: jest.fn(),
  } as unknown as jest.Mocked<PaymentRepository>;
  const gateway = {
    createPaymentIntent: jest.fn(),
    retrievePaymentIntent: jest.fn(),
    cancelPaymentIntent: jest.fn(),
    refund: jest.fn(),
  } as unknown as jest.Mocked<PaymentGateway>;
  const redis = {
    ready: true,
    acquireLock: jest.fn(),
    releaseLock: jest.fn(),
  } as unknown as jest.Mocked<RedisService>;
  const webhookService = {
    handleVerified: jest.fn(),
  } as unknown as jest.Mocked<PaymentWebhookService>;
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
  const items = [{ productId: 1, quantity: 2 }];
  const options = {
    paymentMethod: 'CARD',
    deliveryZone: 'DHAKA',
    customerName: 'Test User',
    customerEmail: 'test@example.com',
    customerPhone: '01700000000',
    deliveryAddressLine: 'House 1, Road 2',
    deliveryArea: 'Dhanmondi',
    deliveryCity: 'Dhaka',
    deliveryPostalCode: '1209',
  } as const;

  beforeEach(() => jest.clearAllMocks());

  it('returns the existing Stripe intent for an idempotent retry', async () => {
    repository.findByIdempotencyKey.mockResolvedValue(payment);
    gateway.retrievePaymentIntent.mockResolvedValue(payableIntent);
    const service = new PaymentService(
      repository,
      gateway,
      redis,
      webhookService,
      config,
    );

    await expect(
      service.createCheckout(user, payment.idempotencyKey, items, options),
    ).resolves.toMatchObject({ paymentId: 1, clientSecret: 'secret' });
    // eslint-disable-next-line @typescript-eslint/unbound-method
    expect(redis.acquireLock).not.toHaveBeenCalled();
    // eslint-disable-next-line @typescript-eslint/unbound-method
    expect(gateway.createPaymentIntent).not.toHaveBeenCalled();
  });

  it('fails safely when the distributed lock cannot be acquired', async () => {
    repository.findByIdempotencyKey.mockResolvedValue(null);
    redis.acquireLock.mockResolvedValue(false);
    const service = new PaymentService(
      repository,
      gateway,
      redis,
      webhookService,
      config,
    );

    await expect(
      service.createCheckout(user, payment.idempotencyKey, items, options),
    ).rejects.toMatchObject({ code: 'CHECKOUT_ALREADY_IN_PROGRESS' });
  });

  it('marks the payment failed when Stripe intent creation fails', async () => {
    repository.findByIdempotencyKey.mockResolvedValue(null);
    repository.findActiveByUser.mockResolvedValue(null);
    repository.createPendingFromItems.mockResolvedValue({
      ...payment,
      providerIntentId: null,
    });
    redis.acquireLock.mockResolvedValue(true);
    redis.releaseLock.mockResolvedValue(true);
    gateway.createPaymentIntent.mockRejectedValue(
      new PaymentGatewayError('Stripe unavailable', 'STRIPE_ERROR'),
    );
    const service = new PaymentService(
      repository,
      gateway,
      redis,
      webhookService,
      config,
    );

    await expect(
      service.createCheckout(user, payment.idempotencyKey, items, options),
    ).rejects.toMatchObject({ code: 'STRIPE_ERROR' });
    // eslint-disable-next-line @typescript-eslint/unbound-method
    expect(repository.createPendingFromItems).toHaveBeenCalledWith(
      user.id,
      items,
      options,
      payment.idempotencyKey,
      'bdt',
      100,
    );
    // eslint-disable-next-line @typescript-eslint/unbound-method
    expect(repository.markCreationFailed).toHaveBeenCalledWith(
      payment.id,
      'STRIPE_ERROR',
      'Stripe unavailable',
    );
    // eslint-disable-next-line @typescript-eslint/unbound-method
    expect(redis.releaseLock).toHaveBeenCalled();
  });

  it('cancels a mismatched active checkout before creating the selected items', async () => {
    repository.findByIdempotencyKey.mockResolvedValue(null);
    repository.findActiveByUser.mockResolvedValue({
      ...payment,
      order: {
        ...payment.order,
        items: [{ ...payment.order.items[0], productId: 99 }],
      },
    });
    repository.createPendingFromItems.mockResolvedValue({
      ...payment,
      id: 4,
      providerIntentId: null,
    });
    repository.attachProviderIntent.mockResolvedValue({ ...payment, id: 4 });
    redis.acquireLock.mockResolvedValue(true);
    redis.releaseLock.mockResolvedValue(true);
    gateway.cancelPaymentIntent.mockResolvedValue();
    gateway.retrievePaymentIntent.mockResolvedValue(payableIntent);
    gateway.createPaymentIntent.mockResolvedValue({
      ...payableIntent,
      id: 'pi_new',
      clientSecret: 'new_secret',
    });
    const service = new PaymentService(
      repository,
      gateway,
      redis,
      webhookService,
      config,
    );

    await expect(
      service.createCheckout(user, 'new-key', items, options),
    ).resolves.toMatchObject({ paymentId: 4, clientSecret: 'new_secret' });
    // eslint-disable-next-line @typescript-eslint/unbound-method
    expect(gateway.cancelPaymentIntent).toHaveBeenCalledWith('pi_123');
    // eslint-disable-next-line @typescript-eslint/unbound-method
    expect(repository.markCancelled).toHaveBeenCalledWith(
      payment.id,
      expect.any(String),
    );
    // eslint-disable-next-line @typescript-eslint/unbound-method
    expect(repository.createPendingFromItems).toHaveBeenCalledWith(
      user.id,
      items,
      options,
      'new-key',
      'bdt',
      100,
    );
  });

  it('reconciles a succeeded active intent instead of trying to cancel it', async () => {
    repository.findByIdempotencyKey.mockResolvedValue(null);
    repository.findActiveByUser.mockResolvedValue({
      ...payment,
      order: {
        ...payment.order,
        items: [{ ...payment.order.items[0], productId: 99 }],
      },
    });
    redis.acquireLock.mockResolvedValue(true);
    redis.releaseLock.mockResolvedValue(true);
    gateway.retrievePaymentIntent.mockResolvedValue({
      ...payableIntent,
      status: 'succeeded',
    });
    const service = new PaymentService(
      repository,
      gateway,
      redis,
      webhookService,
      config,
    );

    await expect(
      service.createCheckout(user, 'new-key', items, options),
    ).rejects.toMatchObject({
      code: 'PAYMENT_ALREADY_SUCCEEDED',
      details: { paymentId: payment.id },
    });
    // eslint-disable-next-line @typescript-eslint/unbound-method
    expect(webhookService.handleVerified).toHaveBeenCalledWith(
      expect.objectContaining({
        paymentIntentId: 'pi_123',
        paymentStatus: 'SUCCEEDED',
      }),
    );
    // eslint-disable-next-line @typescript-eslint/unbound-method
    expect(gateway.cancelPaymentIntent).not.toHaveBeenCalled();
    // eslint-disable-next-line @typescript-eslint/unbound-method
    expect(repository.createPendingFromItems).not.toHaveBeenCalled();
  });

  it('rejects an old checkout that does not contain the delivery charge', async () => {
    repository.findOwnedById.mockResolvedValue({
      ...payment,
      amount: 119_000,
      order: {
        ...payment.order,
        deliveryCharge: 0,
        totalAmount: 119_000,
      },
    });
    const service = new PaymentService(
      repository,
      gateway,
      redis,
      webhookService,
      config,
    );

    await expect(
      service.getCheckoutSession(7, payment.id),
    ).rejects.toMatchObject({ code: 'CHECKOUT_SESSION_OUTDATED' });
  });

  it('cancels an active Stripe payment before order deletion', async () => {
    repository.findByOrderId.mockResolvedValue(payment);
    gateway.cancelPaymentIntent.mockResolvedValue();
    const service = new PaymentService(
      repository,
      gateway,
      redis,
      webhookService,
      config,
    );

    await expect(service.cancelForOrderDeletion(2)).resolves.toBeUndefined();
    // eslint-disable-next-line @typescript-eslint/unbound-method
    expect(gateway.cancelPaymentIntent).toHaveBeenCalledWith('pi_123');
    // eslint-disable-next-line @typescript-eslint/unbound-method
    expect(repository.markCancelled).toHaveBeenCalledWith(
      payment.id,
      expect.any(String),
    );
  });

  it('does not delete an order whose payment is already completed', async () => {
    repository.findByOrderId.mockResolvedValue({
      ...payment,
      status: 'SUCCEEDED',
    });
    const service = new PaymentService(
      repository,
      gateway,
      redis,
      webhookService,
      config,
    );

    await expect(service.cancelForOrderDeletion(2)).rejects.toMatchObject({
      code: 'ORDER_PAYMENT_FINALIZED',
    });
    // eslint-disable-next-line @typescript-eslint/unbound-method
    expect(gateway.cancelPaymentIntent).not.toHaveBeenCalled();
  });

  it('refunds a successful payment when an admin cancels the order', async () => {
    repository.findByOrderId.mockResolvedValue({
      ...payment,
      status: 'SUCCEEDED',
    });
    gateway.refund.mockResolvedValue({ id: 're_123', status: 'succeeded' });
    const service = new PaymentService(
      repository,
      gateway,
      redis,
      webhookService,
      config,
    );

    await expect(service.cancelForAdmin(2)).resolves.toBeUndefined();
    // eslint-disable-next-line @typescript-eslint/unbound-method
    expect(gateway.refund).toHaveBeenCalledWith(
      'pi_123',
      payment.amount,
      'admin-order-cancel-2',
    );
    // eslint-disable-next-line @typescript-eslint/unbound-method
    expect(repository.markRefundedAndCancel).toHaveBeenCalledWith(payment.id);
  });
});
