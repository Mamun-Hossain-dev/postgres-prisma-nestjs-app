import { Inject, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { Transporter } from 'nodemailer';
import { EMAIL_TRANSPORTER } from './constants/email.tokens';
import { buildWelcomeEmail } from './templates/welcome-email.template';

@Injectable()
export class EmailsService {
  private readonly logger = new Logger(EmailsService.name);

  constructor(
    @Inject(EMAIL_TRANSPORTER)
    private readonly transporter: Transporter,
    private readonly configService: ConfigService,
  ) {}

  async sendWelcomeEmail(to: string, name: string): Promise<void> {
    if (!this.configService.get<boolean>('email.enabled', false)) {
      this.logger.debug(`Welcome email skipped for ${to}: mail is disabled`);
      return;
    }

    const template = buildWelcomeEmail(name);

    await this.transporter.sendMail({
      from: this.configService.getOrThrow<string>('email.from'),
      to,
      ...template,
    });
  }
}
