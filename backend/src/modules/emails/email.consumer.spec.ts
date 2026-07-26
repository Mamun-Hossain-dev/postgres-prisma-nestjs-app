import { EmailConsumer } from './email.consumer';

describe('EmailConsumer', () => {
  it('requeues the event when welcome email delivery fails', async () => {
    const emailsService = {
      sendWelcomeEmail: jest.fn().mockRejectedValue(new Error('SMTP offline')),
    };
    const consumer = new EmailConsumer(emailsService as never);
    const message = {};
    const channel = {
      ack: jest.fn(),
      nack: jest.fn(),
    };
    const context = {
      getChannelRef: () => channel,
      getMessage: () => message,
    };

    await expect(
      consumer.handleUserCreated(
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
      ),
    ).resolves.toBeUndefined();

    expect(channel.ack).not.toHaveBeenCalled();
    expect(channel.nack).toHaveBeenCalledWith(message, false, true);
  });
});
