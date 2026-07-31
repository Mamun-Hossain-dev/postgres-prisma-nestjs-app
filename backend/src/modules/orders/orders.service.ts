import { Inject, Injectable } from '@nestjs/common';
import { AppException } from '../../common/exceptions/app.exception';
import type { PaginationOptions } from '../../common/interfaces/pagination.interface';
import { ORDER_REPOSITORY } from './constants/order.tokens';
import { InvoiceService } from './invoices/invoice.service';
import type { OrderRepository } from './repositories/order.repository';

@Injectable()
export class OrdersService {
  constructor(
    @Inject(ORDER_REPOSITORY)
    private readonly repository: OrderRepository,
    private readonly invoiceService: InvoiceService,
  ) {}

  findAll(userId: number, options: PaginationOptions) {
    return this.repository.findAllByUser(userId, options);
  }

  async findOne(userId: number, orderId: number) {
    const order = await this.repository.findById(userId, orderId);
    if (!order) throw this.orderNotFound();
    return order;
  }

  async generateInvoice(userId: number, orderId: number): Promise<Buffer> {
    const data = await this.repository.getInvoiceData(userId, orderId);
    if (!data) {
      throw new AppException('A paid invoice is not available for this order', {
        code: 'INVOICE_NOT_AVAILABLE',
        status: 409,
      });
    }
    return this.invoiceService.generate(data);
  }

  private orderNotFound() {
    return new AppException('Order not found', {
      code: 'ORDER_NOT_FOUND',
      status: 404,
    });
  }
}
