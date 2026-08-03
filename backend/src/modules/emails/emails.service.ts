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
    const dueOnDelivery = new Intl.NumberFormat('en-BD', {
      style: 'currency',
      currency: event.currency.toUpperCase(),
    }).format(event.dueOnDelivery / 100);
    const confirmation =
      event.paymentMethod === 'CASH_ON_DELIVERY'
        ? `Your card deposit for order ${event.orderNumber} is paid. ${dueOnDelivery} is due in cash on delivery.`
        : `Your payment for order ${event.orderNumber} is confirmed.`;
    await this.transporter.sendMail({
      from: this.configService.getOrThrow<string>('email.from'),
      to: event.customer.email,
      subject: `Order ${event.orderNumber} payment confirmed`,
      text: [
        `Hello ${event.customer.name},`,
        '',
        confirmation,
        `Payment ID: ${event.paymentId}`,
        `Total: ${amount}`,
        '',
        'Your PDF invoice is attached.',
      ].join('\n'),
      html: `<main style="font-family:Arial,sans-serif;max-width:640px;margin:auto;padding:32px"><p style="color:#b4472f;font-weight:700">DeviceDock</p><h1>Payment confirmed</h1><p>Hello ${this.escapeHtml(event.customer.name)},</p><p>${this.escapeHtml(confirmation)}</p><p>Payment ID: ${event.paymentId}<br />Paid now: ${this.escapeHtml(amount)}</p><p>Your PDF invoice is attached.</p></main>`,
      attachments: [
        {
          filename: `devicedock-${event.orderNumber}.pdf`,
          content: invoice,
          contentType: 'application/pdf',
        },
      ],
    });
  }

  async sendNewOrderToAdmin(
    event: PaymentSucceededEvent,
    invoice: Buffer,
  ): Promise<void> {
    if (!this.configService.get<boolean>('email.enabled', false)) return;

    const orderTotal = this.money(event.orderTotal, event.currency);
    const paidNow = this.money(event.totalAmount, event.currency);
    const address = [
      event.customer.addressLine,
      event.customer.area,
      event.customer.city,
      event.customer.postalCode,
    ]
      .filter(Boolean)
      .join(', ');
    const items = event.items
      .map(
        (item) =>
          `${item.productTitle} (${item.productSku}) × ${item.quantity} — ${this.money(item.totalAmount, event.currency)}`,
      )
      .join('\n');
    const htmlItems = event.items
      .map(
        (item) =>
          `<li>${this.escapeHtml(item.productTitle)} (${this.escapeHtml(item.productSku)}) × ${item.quantity} — ${this.escapeHtml(this.money(item.totalAmount, event.currency))}</li>`,
      )
      .join('');

    await this.transporter.sendMail({
      from: this.configService.getOrThrow<string>('email.from'),
      to: this.configService.getOrThrow<string>('email.adminTo'),
      subject: `New confirmed order ${event.orderNumber}`,
      text: [
        `Order: ${event.orderNumber}`,
        `Customer: ${event.customer.name}`,
        `Email: ${event.customer.email}`,
        `Phone: ${event.customer.phone}`,
        `Address: ${address}`,
        `Delivery zone: ${event.deliveryZone}`,
        `Payment: ${event.paymentMethod}`,
        '',
        items,
        '',
        `Order total: ${orderTotal}`,
        `Paid now: ${paidNow}`,
      ].join('\n'),
      html: `<main style="font-family:Arial,sans-serif;max-width:680px;margin:auto;padding:32px"><p style="color:#b4472f;font-weight:700">DeviceDock</p><h1>New confirmed order</h1><p><strong>${this.escapeHtml(event.orderNumber)}</strong></p><h2>Customer and delivery</h2><p>${this.escapeHtml(event.customer.name)}<br />${this.escapeHtml(event.customer.email)}<br />${this.escapeHtml(event.customer.phone)}<br />${this.escapeHtml(address)}</p><h2>Products</h2><ul>${htmlItems}</ul><p><strong>Order total: ${this.escapeHtml(orderTotal)}</strong><br />Paid now: ${this.escapeHtml(paidNow)}</p></main>`,
      attachments: [
        {
          filename: `devicedock-${event.orderNumber}.pdf`,
          content: invoice,
          contentType: 'application/pdf',
        },
      ],
    });
  }

  private money(amount: number, currency: string): string {
    return new Intl.NumberFormat('en-BD', {
      style: 'currency',
      currency: currency.toUpperCase(),
    }).format(amount / 100);
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
