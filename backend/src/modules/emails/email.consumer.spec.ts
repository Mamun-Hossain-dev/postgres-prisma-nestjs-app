import { EmailConsumer } from './email.consumer';

describe('EmailConsumer', () => {
  it('throws when welcome email delivery fails so RabbitMQ can retry it', async () => {
    const emailsService = {
      sendWelcomeEmail: jest.fn().mockRejectedValue(new Error('SMTP offline')),
    };
    const consumer = new EmailConsumer(emailsService as never, {} as never);

    await expect(
      consumer.handleUserCreated({
        id: 1,
        name: 'User',
        email: 'user@example.com',
        age: 20,
        role: 'USER',
        isBlocked: false,
        profileImageUrl: null,
      }),
    ).rejects.toThrow('SMTP offline');
  });
});
