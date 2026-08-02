import type { ConfigService } from '@nestjs/config';
import type { ClientProxy } from '@nestjs/microservices';
import { of, throwError } from 'rxjs';
import { PaymentCommands } from '../constants/payment.constants';
import { PaymentRpcClient } from './payment-rpc.client';

describe('PaymentRpcClient', () => {
  const command = {
    customer: { id: 1, name: 'Customer', email: 'customer@example.com' },
    idempotencyKey: '9cf8ed35-c195-49af-a2f1-e747d802b023',
    items: [{ productId: 3, quantity: 2 }],
  };
  const config = {
    getOrThrow: jest.fn().mockReturnValue(10_000),
  } as unknown as ConfigService;

  it('sends process.payment and returns the immediate result', async () => {
    const result = { paymentIntentId: 'pi_1', clientSecret: 'secret' };
    const client = {
      send: jest.fn().mockReturnValue(of(result)),
    };
    const rpc = new PaymentRpcClient(client as unknown as ClientProxy, config);

    await expect(rpc.process(command)).resolves.toBe(result);
    expect(client.send).toHaveBeenCalledWith(PaymentCommands.PROCESS, command);
  });

  it('restores stable errors returned by the payment processor', async () => {
    const client = {
      send: jest.fn().mockReturnValue(
        throwError(() => ({
          status: 'error',
          message: {
            code: 'CHECKOUT_ALREADY_IN_PROGRESS',
            message: 'Checkout is already running',
            status: 409,
          },
        })),
      ),
    };
    const rpc = new PaymentRpcClient(client as unknown as ClientProxy, config);

    await expect(rpc.process(command)).rejects.toMatchObject({
      code: 'CHECKOUT_ALREADY_IN_PROGRESS',
      message: 'Checkout is already running',
    });
  });
});
