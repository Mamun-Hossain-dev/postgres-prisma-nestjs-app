import { AppException } from '../../../common/exceptions/app.exception';
import type { RmqContext } from '@nestjs/microservices';
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
    options: {
      paymentMethod: 'CARD',
      deliveryZone: 'DHAKA',
      customerName: 'Customer',
      customerEmail: 'customer@example.com',
      customerPhone: '01700000000',
      deliveryAddressLine: 'House 1, Road 2',
      deliveryArea: 'Dhanmondi',
      deliveryCity: 'Dhaka',
    } as const,
  };

  function createContext() {
    const channel = { ack: jest.fn() };
    const message = { content: Buffer.from('payment'), properties: {} };
    const context = {
      getChannelRef: () => channel,
      getMessage: () => message,
    } as unknown as RmqContext;

    return { channel, context, message };
  }

  beforeEach(() => jest.clearAllMocks());

  it('returns as soon as the checkout session is created', async () => {
    const result = { paymentIntentId: 'pi_1', clientSecret: 'secret' };
    paymentService.createCheckout.mockResolvedValue(result as never);
    const controller = new PaymentRpcController(paymentService);
    const { channel, context, message } = createContext();

    await expect(controller.processPayment(command, context)).resolves.toBe(
      result,
    );
    expect(channel.ack).toHaveBeenCalledWith(message);
  });

  it('serializes stable application errors for the RPC client', async () => {
    paymentService.createCheckout.mockRejectedValue(
      new AppException('Checkout is already running', {
        code: 'CHECKOUT_ALREADY_IN_PROGRESS',
        status: 409,
      }),
    );
    const controller = new PaymentRpcController(paymentService);
    const { channel, context, message } = createContext();

    await expect(
      controller.processPayment(command, context),
    ).rejects.toMatchObject({
      error: {
        code: 'CHECKOUT_ALREADY_IN_PROGRESS',
        message: 'Checkout is already running',
        status: 409,
      },
    });
    expect(channel.ack).toHaveBeenCalledWith(message);
  });
});
