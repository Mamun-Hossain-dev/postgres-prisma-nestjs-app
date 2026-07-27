import { EmailConsumer } from './email.consumer';

describe('EmailConsumer', () => {
  it('rejects a failed welcome email without requeueing it', async () => {
    const emailsService = {
      sendWelcomeEmail: jest.fn().mockRejectedValue(new Error('SMTP offline')),
    };
    const consumer = new EmailConsumer(emailsService as never);
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

    expect(channel.ack).not.toHaveBeenCalled();
    expect(channel.nack).toHaveBeenCalledWith(message, false, false);
  });
});
