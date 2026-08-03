import type { InvoiceService } from './invoices/invoice.service';
import { OrdersService } from './orders.service';
import type { OrderRepository } from './repositories/order.repository';
import type { PaymentService } from '../payments/payment.service';

describe('OrdersService', () => {
  const repository = {
    findAll: jest.fn(),
    findAllByUser: jest.fn(),
    findById: jest.fn(),
    findByIdForAdmin: jest.fn(),
    updateStatus: jest.fn(),
    deleteRemovable: jest.fn(),
    getInvoiceData: jest.fn(),
    getInvoiceDataForAdmin: jest.fn(),
  } as jest.Mocked<OrderRepository>;
  const invoiceService = {
    generate: jest.fn(),
  } as unknown as jest.Mocked<InvoiceService>;
  const paymentService = {
    cancelForOrderDeletion: jest.fn(),
    cancelForAdmin: jest.fn(),
  } as unknown as jest.Mocked<PaymentService>;

  beforeEach(() => jest.clearAllMocks());

  it('lists all orders through the admin repository method', async () => {
    const result = { data: [], meta: { page: 1, limit: 10 } };
    repository.findAll.mockResolvedValue(result as never);
    const service = new OrdersService(
      repository,
      invoiceService,
      paymentService,
    );

    await expect(service.findAllForAdmin({ page: 1, limit: 10 })).resolves.toBe(
      result,
    );
  });

  it('generates an admin invoice without applying customer ownership', async () => {
    const invoiceData = { orderId: 4 };
    const pdf = Buffer.from('pdf');
    repository.getInvoiceDataForAdmin.mockResolvedValue(invoiceData as never);
    invoiceService.generate.mockResolvedValue(pdf);
    const service = new OrdersService(
      repository,
      invoiceService,
      paymentService,
    );

    await expect(service.generateInvoiceForAdmin(4)).resolves.toBe(pdf);
    // eslint-disable-next-line @typescript-eslint/unbound-method
    expect(repository.getInvoiceDataForAdmin).toHaveBeenCalledWith(4);
  });

  it('cancels and deletes a payment-pending order', async () => {
    repository.findByIdForAdmin.mockResolvedValue({
      id: 4,
      status: 'PAYMENT_PENDING',
    } as never);
    repository.deleteRemovable.mockResolvedValue(true);
    const service = new OrdersService(
      repository,
      invoiceService,
      paymentService,
    );

    await expect(service.deleteForAdmin(4)).resolves.toBeUndefined();
    // eslint-disable-next-line @typescript-eslint/unbound-method
    expect(paymentService.cancelForOrderDeletion).toHaveBeenCalledWith(4);
    // eslint-disable-next-line @typescript-eslint/unbound-method
    expect(repository.deleteRemovable).toHaveBeenCalledWith(4);
  });

  it('rejects deleting a paid order', async () => {
    repository.findByIdForAdmin.mockResolvedValue({
      id: 4,
      status: 'PAID',
    } as never);
    const service = new OrdersService(
      repository,
      invoiceService,
      paymentService,
    );

    await expect(service.deleteForAdmin(4)).rejects.toMatchObject({
      code: 'ORDER_DELETE_NOT_ALLOWED',
    });
    // eslint-disable-next-line @typescript-eslint/unbound-method
    expect(repository.deleteRemovable).not.toHaveBeenCalled();
  });

  it('moves a confirmed order into processing', async () => {
    const order = { id: 4, status: 'PAID' };
    repository.findByIdForAdmin.mockResolvedValue(order as never);
    repository.updateStatus.mockResolvedValue({
      ...order,
      status: 'PROCESSING',
    } as never);
    const service = new OrdersService(
      repository,
      invoiceService,
      paymentService,
    );

    await expect(
      service.updateStatusForAdmin(4, 'PROCESSING'),
    ).resolves.toMatchObject({ status: 'PROCESSING' });
    // eslint-disable-next-line @typescript-eslint/unbound-method
    expect(repository.updateStatus).toHaveBeenCalledWith(4, 'PROCESSING');
  });

  it('refunds through the payment service when an admin cancels a paid order', async () => {
    repository.findByIdForAdmin
      .mockResolvedValueOnce({ id: 4, status: 'PAID' } as never)
      .mockResolvedValueOnce({ id: 4, status: 'CANCELLED' } as never);
    const service = new OrdersService(
      repository,
      invoiceService,
      paymentService,
    );

    await expect(
      service.updateStatusForAdmin(4, 'CANCELLED'),
    ).resolves.toMatchObject({ status: 'CANCELLED' });
    // eslint-disable-next-line @typescript-eslint/unbound-method
    expect(paymentService.cancelForAdmin).toHaveBeenCalledWith(4);
  });
});
