import type { InvoiceService } from './invoices/invoice.service';
import { OrdersService } from './orders.service';
import type { OrderRepository } from './repositories/order.repository';

describe('OrdersService', () => {
  const repository = {
    findAll: jest.fn(),
    findAllByUser: jest.fn(),
    findById: jest.fn(),
    findByIdForAdmin: jest.fn(),
    getInvoiceData: jest.fn(),
    getInvoiceDataForAdmin: jest.fn(),
  } as jest.Mocked<OrderRepository>;
  const invoiceService = {
    generate: jest.fn(),
  } as unknown as jest.Mocked<InvoiceService>;

  beforeEach(() => jest.clearAllMocks());

  it('lists all orders through the admin repository method', async () => {
    const result = { data: [], meta: { page: 1, limit: 10 } };
    repository.findAll.mockResolvedValue(result as never);
    const service = new OrdersService(repository, invoiceService);

    await expect(service.findAllForAdmin({ page: 1, limit: 10 })).resolves.toBe(
      result,
    );
  });

  it('generates an admin invoice without applying customer ownership', async () => {
    const invoiceData = { orderId: 4 };
    const pdf = Buffer.from('pdf');
    repository.getInvoiceDataForAdmin.mockResolvedValue(invoiceData as never);
    invoiceService.generate.mockResolvedValue(pdf);
    const service = new OrdersService(repository, invoiceService);

    await expect(service.generateInvoiceForAdmin(4)).resolves.toBe(pdf);
    // eslint-disable-next-line @typescript-eslint/unbound-method
    expect(repository.getInvoiceDataForAdmin).toHaveBeenCalledWith(4);
  });
});
