import { InvoiceService } from './invoice.service';
import type { PaymentSucceededEvent } from '../../payments/interfaces/payment.interface';

describe('InvoiceService', () => {
  it('generates a PDF invoice with order payment data', async () => {
    const event: PaymentSucceededEvent = {
      eventId: 'evt_1',
      orderId: 1,
      orderNumber: 'DD-TEST',
      paymentId: 2,
      customer: {
        id: 3,
        name: 'Test User',
        email: 'test@example.com',
        phone: '01700000000',
        addressLine: 'House 1, Road 2',
        area: 'Dhanmondi',
        city: 'Dhaka',
        postalCode: '1209',
      },
      items: [
        {
          productTitle: 'Test Phone',
          productSku: 'PHONE-1',
          unitAmount: 100_000,
          quantity: 1,
          totalAmount: 100_000,
        },
      ],
      totalAmount: 100_000,
      orderTotal: 106_000,
      subtotalAmount: 100_000,
      discountAmount: 0,
      deliveryCharge: 6_000,
      dueOnDelivery: 0,
      paymentMethod: 'CARD',
      deliveryZone: 'DHAKA',
      currency: 'bdt',
      paymentStatus: 'SUCCEEDED',
      paymentDate: new Date().toISOString(),
    };

    const invoice = await new InvoiceService().generate(event);

    expect(invoice.subarray(0, 4).toString()).toBe('%PDF');
    expect(invoice.length).toBeGreaterThan(500);
  });
});
