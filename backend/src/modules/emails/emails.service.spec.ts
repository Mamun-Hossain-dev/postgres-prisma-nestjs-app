import type { ConfigService } from '@nestjs/config';
import type { SendMailOptions, Transporter } from 'nodemailer';
import { EmailsService } from './emails.service';

describe('EmailsService', () => {
  let sentMessage: SendMailOptions | undefined;
  const sendMail = jest.fn((options: SendMailOptions): Promise<unknown> => {
    sentMessage = options;
    return Promise.resolve({ messageId: 'test-id' });
  });

  beforeEach(() => {
    sentMessage = undefined;
    sendMail.mockClear();
  });

  it('skips sending when mail is disabled', async () => {
    const configService = {
      get: jest.fn().mockReturnValue(false),
      getOrThrow: jest.fn(),
    } as unknown as ConfigService;
    const service = new EmailsService(
      { sendMail } as unknown as Transporter,
      configService,
    );

    await service.sendWelcomeEmail('user@example.com', 'User');

    expect(sendMail).not.toHaveBeenCalled();
  });

  it('sends an HTML welcome email with an inline image', async () => {
    const configService = {
      get: jest.fn().mockReturnValue(true),
      getOrThrow: jest.fn().mockReturnValue('Nest API <hello@example.com>'),
    } as unknown as ConfigService;
    const service = new EmailsService(
      { sendMail } as unknown as Transporter,
      configService,
    );

    await service.sendWelcomeEmail('user@example.com', '<User>');

    expect(sendMail).toHaveBeenCalledTimes(1);
    expect(sentMessage).toBeDefined();
    expect(sentMessage?.from).toBe('Nest API <hello@example.com>');
    expect(sentMessage?.to).toBe('user@example.com');
    expect(sentMessage?.subject).toContain('Welcome');
    expect(sentMessage?.html).toContain('cid:welcome-banner@nestjs-learning');
    expect(sentMessage?.html).toContain('&lt;User&gt;');
    expect(sentMessage?.attachments).toEqual([
      expect.objectContaining({
        contentType: 'image/png',
        cid: 'welcome-banner@nestjs-learning',
      }) as unknown,
    ]);
  });
});
