import { Injectable } from '@nestjs/common';
import PDFDocument from 'pdfkit';
import type { PaymentSucceededEvent } from '../../payments/interfaces/payment.interface';

@Injectable()
export class InvoiceService {
  generate(data: PaymentSucceededEvent): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      const document = new PDFDocument({ margin: 48, size: 'A4' });
      const chunks: Buffer[] = [];
      document.on('data', (chunk: Buffer) => chunks.push(chunk));
      document.on('end', () => resolve(Buffer.concat(chunks)));
      document.on('error', reject);

      document.fontSize(24).text('DeviceDock', { continued: true });
      document.fontSize(12).fillColor('#b4472f').text('  PAYMENT INVOICE');
      document.moveDown();
      document.fillColor('#111111').fontSize(11);
      document.text(`Order: ${data.orderNumber}`);
      document.text(`Payment ID: ${data.paymentId}`);
      document.text(`Payment status: ${data.paymentStatus}`);
      document.text(
        `Payment date: ${new Date(data.paymentDate).toLocaleString('en-BD')}`,
      );
      document.moveDown();
      document.fontSize(14).text('Customer');
      document.fontSize(11).text(data.customer.name);
      document.text(data.customer.email);
      document.moveDown();
      document.fontSize(14).text('Purchased products');
      document.moveDown(0.5);

      data.items.forEach((item) => {
        document
          .fontSize(11)
          .text(`${item.productTitle} (${item.productSku})`, {
            continued: true,
          })
          .text(`  × ${item.quantity}`, { align: 'right' });
        document
          .fillColor('#555555')
          .text(this.money(item.totalAmount, data.currency), {
            align: 'right',
          })
          .fillColor('#111111');
        document.moveDown(0.5);
      });

      document.moveDown();
      document.moveTo(48, document.y).lineTo(547, document.y).stroke('#dddddd');
      document.moveDown();
      document
        .fontSize(15)
        .text(`Total: ${this.money(data.totalAmount, data.currency)}`, {
          align: 'right',
        });
      document.end();
    });
  }

  private money(amount: number, currency: string): string {
    return new Intl.NumberFormat('en-BD', {
      style: 'currency',
      currency: currency.toUpperCase(),
    }).format(amount / 100);
  }
}
