import type {
  PaginatedResult,
  PaginationOptions,
} from '../../../common/interfaces/pagination.interface';
import type {
  OrderView,
  PaymentSucceededEvent,
} from '../../payments/interfaces/payment.interface';
import type { AdminOrderQueryDto } from '../dto/admin-order-query.dto';

export interface OrderRepository {
  findAllByUser(
    userId: number,
    options: PaginationOptions,
  ): Promise<PaginatedResult<OrderView>>;
  findById(userId: number, orderId: number): Promise<OrderView | null>;
  findAll(options: AdminOrderQueryDto): Promise<PaginatedResult<OrderView>>;
  findByIdForAdmin(orderId: number): Promise<OrderView | null>;
  updateStatus(
    orderId: number,
    status: OrderView['status'],
  ): Promise<OrderView>;
  deleteRemovable(orderId: number): Promise<boolean>;
  getInvoiceData(
    userId: number,
    orderId: number,
  ): Promise<PaymentSucceededEvent | null>;
  getInvoiceDataForAdmin(
    orderId: number,
  ): Promise<PaymentSucceededEvent | null>;
}
