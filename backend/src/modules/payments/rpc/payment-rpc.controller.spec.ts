import { AppException } from '../../../common/exceptions/app.exception';
import type { PaymentService } from '../payment.service';
import { PaymentRpcController } from './payment-rpc.controller';

describe('PaymentRpcController', () => {
  const paymentService = {
    createCheckout: jest.fn(),
  } as unknown as jest.Mocked<PaymentService>;
  const command = {
    customer: { id: 1, name: 'Customer', email: 'customer@example.com' },
    idempotencyKey: '9cf8ed35-c195-49af-a2f1-e747d802b023',
    items: [{ productId: 3, quantity: 2 }],
    options: { paymentMethod: 'CARD', deliveryZone: 'DHAKA' } as const,
  };

  beforeEach(() => jest.clearAllMocks());

  it('returns as soon as the checkout session is created', async () => {
    const result = { paymentIntentId: 'pi_1', clientSecret: 'secret' };
    paymentService.createCheckout.mockResolvedValue(result as never);
    const controller = new PaymentRpcController(paymentService);

    await expect(controller.processPayment(command)).resolves.toBe(result);
  });

  it('serializes stable application errors for the RPC client', async () => {
    paymentService.createCheckout.mockRejectedValue(
      new AppException('Checkout is already running', {
        code: 'CHECKOUT_ALREADY_IN_PROGRESS',
        status: 409,
      }),
    );
    const controller = new PaymentRpcController(paymentService);

    await expect(controller.processPayment(command)).rejects.toMatchObject({
      error: {
        code: 'CHECKOUT_ALREADY_IN_PROGRESS',
        message: 'Checkout is already running',
        status: 409,
      },
    });
  });
});
