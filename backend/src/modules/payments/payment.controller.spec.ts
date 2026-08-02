import type { PaymentWebhookService } from './payment-webhook.service';
import type { PaymentService } from './payment.service';
import { PaymentController } from './payment.controller';
import type { PaymentRpcClient } from './rpc/payment-rpc.client';

describe('PaymentController', () => {
  it('uses the process.payment RPC path for checkout creation', async () => {
    const rpcClient = {
      process: jest.fn().mockResolvedValue({
        paymentIntentId: 'pi_1',
        clientSecret: 'secret',
      }),
    } as unknown as jest.Mocked<PaymentRpcClient>;
    const controller = new PaymentController(
      {} as PaymentService,
      {} as PaymentWebhookService,
      rpcClient,
    );
    const user = {
      id: 7,
      name: 'Customer',
      email: 'customer@example.com',
    } as never;

    await controller.createCheckout(user, {
      idempotencyKey: '9cf8ed35-c195-49af-a2f1-e747d802b023',
      paymentMethod: 'CASH_ON_DELIVERY',
      deliveryZone: 'OUTSIDE_DHAKA',
      items: [{ productId: 3, quantity: 2 }],
    });

    // eslint-disable-next-line @typescript-eslint/unbound-method
    expect(rpcClient.process).toHaveBeenCalledWith({
      customer: {
        id: 7,
        name: 'Customer',
        email: 'customer@example.com',
      },
      idempotencyKey: '9cf8ed35-c195-49af-a2f1-e747d802b023',
      items: [{ productId: 3, quantity: 2 }],
      options: {
        paymentMethod: 'CASH_ON_DELIVERY',
        deliveryZone: 'OUTSIDE_DHAKA',
      },
    });
  });
});
