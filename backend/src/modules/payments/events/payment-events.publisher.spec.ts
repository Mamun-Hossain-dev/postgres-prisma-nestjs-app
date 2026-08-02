import { Logger } from '@nestjs/common';
import type { ClientProxy } from '@nestjs/microservices';
import { of } from 'rxjs';
import { PaymentEvents } from '../constants/payment.constants';
import type { PaymentSucceededEvent } from '../interfaces/payment.interface';
import { PaymentEventsPublisher } from './payment-events.publisher';

describe('PaymentEventsPublisher', () => {
  const event = {
    eventId: 'evt_1',
    paymentStatus: 'SUCCEEDED',
  } as PaymentSucceededEvent;

  function createClient() {
    return { emit: jest.fn().mockReturnValue(of(undefined)) };
  }

  afterEach(() => jest.restoreAllMocks());

  it('publishes payment.succeeded to every destination queue', async () => {
    const clients = [createClient(), createClient(), createClient()];
    const publisher = new PaymentEventsPublisher(
      clients[0] as unknown as ClientProxy,
      clients[1] as unknown as ClientProxy,
      clients[2] as unknown as ClientProxy,
    );

    await publisher.publishSucceeded(event);

    clients.forEach((client) => {
      expect(client.emit).toHaveBeenCalledWith(PaymentEvents.SUCCEEDED, event);
    });
  });

  it('returns a retryable error when any destination publish fails', async () => {
    jest.spyOn(Logger.prototype, 'error').mockImplementation(() => undefined);
    const clients = [createClient(), createClient(), createClient()];
    clients[1].emit.mockImplementation(() => {
      throw new Error('RabbitMQ unavailable');
    });
    const publisher = new PaymentEventsPublisher(
      clients[0] as unknown as ClientProxy,
      clients[1] as unknown as ClientProxy,
      clients[2] as unknown as ClientProxy,
    );

    await expect(publisher.publishSucceeded(event)).rejects.toMatchObject({
      code: 'PAYMENT_EVENT_PUBLISH_FAILED',
    });
  });
});
