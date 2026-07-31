import { Inject, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { Transporter } from 'nodemailer';
import { EMAIL_TRANSPORTER } from './constants/email.tokens';
import { buildWelcomeEmail } from './templates/welcome-email.template';
import type { PaymentSucceededEvent } from '../payments/interfaces/payment.interface';

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

  async sendNewsletterEmail(
    to: string,
    subject: string,
    content: string,
    previewText?: string,
  ): Promise<void> {
    if (!this.configService.get<boolean>('email.enabled', false)) {
      this.logger.debug(`Newsletter email skipped for ${to}: mail is disabled`);
      return;
    }

    const escapeHtml = (value: string) =>
      value
        .replaceAll('&', '&amp;')
        .replaceAll('<', '&lt;')
        .replaceAll('>', '&gt;')
        .replaceAll('"', '&quot;')
        .replaceAll("'", '&#039;');
    const htmlContent = escapeHtml(content).replaceAll('\n', '<br />');

    await this.transporter.sendMail({
      from: this.configService.getOrThrow<string>('email.from'),
      to,
      subject,
      text: `${previewText ? `${previewText}\n\n` : ''}${content}`,
      html: `<main style="font-family:Arial,sans-serif;max-width:640px;margin:auto;padding:32px"><p style="color:#b4472f;font-weight:700">DeviceDock</p>${previewText ? `<p style="color:#666">${escapeHtml(previewText)}</p>` : ''}<div style="line-height:1.7">${htmlContent}</div></main>`,
    });
  }

  async sendPaymentConfirmation(
    event: PaymentSucceededEvent,
    invoice: Buffer,
  ): Promise<void> {
    if (!this.configService.get<boolean>('email.enabled', false)) {
      this.logger.debug(
        `Payment confirmation skipped for ${event.customer.email}: mail is disabled`,
      );
      return;
    }

    const amount = new Intl.NumberFormat('en-BD', {
      style: 'currency',
      currency: event.currency.toUpperCase(),
    }).format(event.totalAmount / 100);
    await this.transporter.sendMail({
      from: this.configService.getOrThrow<string>('email.from'),
      to: event.customer.email,
      subject: `Order ${event.orderNumber} payment confirmed`,
      text: [
        `Hello ${event.customer.name},`,
        '',
        `Your payment for order ${event.orderNumber} is confirmed.`,
        `Payment ID: ${event.paymentId}`,
        `Total: ${amount}`,
        '',
        'Your PDF invoice is attached.',
      ].join('\n'),
      html: `<main style="font-family:Arial,sans-serif;max-width:640px;margin:auto;padding:32px"><p style="color:#b4472f;font-weight:700">DeviceDock</p><h1>Payment confirmed</h1><p>Hello ${this.escapeHtml(event.customer.name)},</p><p>Your payment for order <strong>${this.escapeHtml(event.orderNumber)}</strong> has succeeded.</p><p>Payment ID: ${event.paymentId}<br />Total: ${this.escapeHtml(amount)}</p><p>Your PDF invoice is attached.</p></main>`,
      attachments: [
        {
          filename: `devicedock-${event.orderNumber}.pdf`,
          content: invoice,
          contentType: 'application/pdf',
        },
      ],
    });
  }

  private escapeHtml(value: string): string {
    return value
      .replaceAll('&', '&amp;')
      .replaceAll('<', '&lt;')
      .replaceAll('>', '&gt;')
      .replaceAll('"', '&quot;')
      .replaceAll("'", '&#039;');
  }
}
