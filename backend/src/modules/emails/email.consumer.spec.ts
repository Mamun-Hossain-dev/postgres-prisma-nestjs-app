import { EmailConsumer } from './email.consumer';

describe('EmailConsumer', () => {
  it('acknowledges a successfully sent welcome email', async () => {
    const emailsService = {
      sendWelcomeEmail: jest.fn().mockResolvedValue(undefined),
    };
    const retryService = { handleFailure: jest.fn() };
    const consumer = new EmailConsumer(
      emailsService as never,
      retryService as never,
    );
    const channel = { ack: jest.fn(), nack: jest.fn() };
    const message = {};
    const context = {
      getChannelRef: () => channel,
      getMessage: () => message,
    };

    await consumer.handleUserCreated(
      {
        id: 1,
        name: 'User',
        email: 'user@example.com',
        age: 20,
        role: 'USER',
        isBlocked: false,
        profileImageUrl: null,
      },
      context as never,
    );

    expect(emailsService.sendWelcomeEmail).toHaveBeenCalledWith(
      'user@example.com',
      'User',
    );
    expect(channel.ack).toHaveBeenCalledWith(message);
    expect(channel.nack).not.toHaveBeenCalled();
  });

  it('routes a failed welcome email through the retry service', async () => {
    const error = new Error('SMTP offline');
    const emailsService = {
      sendWelcomeEmail: jest.fn().mockRejectedValue(error),
    };
    const retryService = {
      handleFailure: jest.fn().mockResolvedValue(undefined),
    };
    const consumer = new EmailConsumer(
      emailsService as never,
      retryService as never,
    );
    const channel = { ack: jest.fn(), nack: jest.fn() };
    const message = { content: Buffer.from('{}') };
    const context = {
      getChannelRef: () => channel,
      getMessage: () => message,
    };

    await consumer.handleUserCreated(
      {
        id: 1,
        name: 'User',
        email: 'user@example.com',
        age: 20,
        role: 'USER',
        isBlocked: false,
        profileImageUrl: null,
      },
      context as never,
    );

    expect(channel.ack).not.toHaveBeenCalled();
    expect(channel.nack).not.toHaveBeenCalled();
    expect(retryService.handleFailure).toHaveBeenCalledWith(
      context,
      'user.events.emails',
      error,
    );
  });
});
