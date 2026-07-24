import { EmailListener } from './email.listener';

describe('EmailListener', () => {
  it('contains mail failures so registration remains successful', async () => {
    const emailsService = {
      sendWelcomeEmail: jest.fn().mockRejectedValue(new Error('SMTP offline')),
    };
    const listener = new EmailListener(emailsService as never);

    await expect(
      listener.handleUserCreated({
        id: 1,
        name: 'User',
        email: 'user@example.com',
        age: 20,
        role: 'USER',
        isBlocked: false,
        profileImageUrl: null,
      }),
    ).resolves.toBeUndefined();
  });
});
