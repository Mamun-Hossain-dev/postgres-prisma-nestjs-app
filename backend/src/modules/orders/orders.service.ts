import { Inject, Injectable } from '@nestjs/common';
import { AppException } from '../../common/exceptions/app.exception';
import type { PaginationOptions } from '../../common/interfaces/pagination.interface';
import { ORDER_REPOSITORY } from './constants/order.tokens';
import { InvoiceService } from './invoices/invoice.service';
import type { OrderRepository } from './repositories/order.repository';
import { PaymentService } from '../payments/payment.service';

@Injectable()
export class OrdersService {
  constructor(
    @Inject(ORDER_REPOSITORY)
    private readonly repository: OrderRepository,
    private readonly invoiceService: InvoiceService,
    private readonly paymentService: PaymentService,
  ) {}

  findAll(userId: number, options: PaginationOptions) {
    return this.repository.findAllByUser(userId, options);
  }

  findAllForAdmin(options: PaginationOptions) {
    return this.repository.findAll(options);
  }

  async findOne(userId: number, orderId: number) {
    const order = await this.repository.findById(userId, orderId);
    if (!order) throw this.orderNotFound();
    return order;
  }

  async findOneForAdmin(orderId: number) {
    const order = await this.repository.findByIdForAdmin(orderId);
    if (!order) throw this.orderNotFound();
    return order;
  }

  async deleteForAdmin(orderId: number): Promise<void> {
    const order = await this.repository.findByIdForAdmin(orderId);
    if (!order) throw this.orderNotFound();
    if (order.status !== 'PAYMENT_PENDING' && order.status !== 'CANCELLED') {
      throw this.orderDeleteNotAllowed();
    }
    if (order.status === 'PAYMENT_PENDING') {
      await this.paymentService.cancelForOrderDeletion(orderId);
    }
    if (!(await this.repository.deleteRemovable(orderId))) {
      throw this.orderDeleteNotAllowed();
    }
  }

  async generateInvoice(userId: number, orderId: number): Promise<Buffer> {
    const data = await this.repository.getInvoiceData(userId, orderId);
    if (!data) throw this.invoiceNotAvailable();
    return this.invoiceService.generate(data);
  }

  async generateInvoiceForAdmin(orderId: number): Promise<Buffer> {
    const data = await this.repository.getInvoiceDataForAdmin(orderId);
    if (!data) throw this.invoiceNotAvailable();
    return this.invoiceService.generate(data);
  }

  private invoiceNotAvailable() {
    return new AppException('A paid invoice is not available for this order', {
      code: 'INVOICE_NOT_AVAILABLE',
      status: 409,
    });
  }

  private orderNotFound() {
    return new AppException('Order not found', {
      code: 'ORDER_NOT_FOUND',
      status: 404,
    });
  }

  private orderDeleteNotAllowed() {
    return new AppException(
      'Only payment-pending or cancelled orders can be deleted',
      {
        code: 'ORDER_DELETE_NOT_ALLOWED',
        status: 409,
      },
    );
  }
}
