import { of } from 'rxjs';
import { Logger } from '@nestjs/common';
import type { ClientProxy } from '@nestjs/microservices';
import { UserEventsPublisher } from './user-events.publisher';
import { UserEvents, type UserCreatedEvent } from './user.events';

describe('UserEventsPublisher', () => {
  const event: UserCreatedEvent = {
    id: 1,
    name: 'User',
    email: 'user@example.com',
    age: 20,
    role: 'USER',
    isBlocked: false,
    profileImageUrl: null,
  };

  function createClient() {
    return {
      emit: jest.fn().mockReturnValue(of(undefined)),
    };
  }

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('publishes a destination-specific user-created event to every queue', async () => {
    const emailsClient = createClient();
    const notificationsClient = createClient();
    const analyticsClient = createClient();
    const publisher = new UserEventsPublisher(
      emailsClient as unknown as ClientProxy,
      notificationsClient as unknown as ClientProxy,
      analyticsClient as unknown as ClientProxy,
    );

    await publisher.publishCreated(event);

    expect(emailsClient.emit).toHaveBeenCalledWith(
      UserEvents.CREATED_EMAIL,
      event,
    );
    expect(notificationsClient.emit).toHaveBeenCalledWith(
      UserEvents.CREATED_NOTIFICATION,
      event,
    );
    expect(analyticsClient.emit).toHaveBeenCalledWith(
      UserEvents.CREATED_ANALYTICS,
      event,
    );
  });

  it('logs one publish failure without failing successful publishes', async () => {
    const logger = jest
      .spyOn(Logger.prototype, 'error')
      .mockImplementation(() => undefined);
    const emailsClient = createClient();
    const notificationsClient = {
      emit: jest.fn().mockImplementation(() => {
        throw new Error('RabbitMQ unavailable');
      }),
    };
    const analyticsClient = createClient();
    const publisher = new UserEventsPublisher(
      emailsClient as unknown as ClientProxy,
      notificationsClient as unknown as ClientProxy,
      analyticsClient as unknown as ClientProxy,
    );

    await expect(publisher.publishCreated(event)).resolves.toBeUndefined();

    expect(emailsClient.emit).toHaveBeenCalledWith(
      UserEvents.CREATED_EMAIL,
      event,
    );
    expect(notificationsClient.emit).toHaveBeenCalledWith(
      UserEvents.CREATED_NOTIFICATION,
      event,
    );
    expect(analyticsClient.emit).toHaveBeenCalledWith(
      UserEvents.CREATED_ANALYTICS,
      event,
    );
    expect(logger).toHaveBeenCalledWith(
      expect.stringContaining(
        'Failed to publish user-created event to notifications',
      ),
      expect.any(String),
    );
  });
});
