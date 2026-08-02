import type {
  PaginatedResult,
  PaginationOptions,
} from '../../../common/interfaces/pagination.interface';
import type {
  OrderView,
  PaymentSucceededEvent,
} from '../../payments/interfaces/payment.interface';

export interface OrderRepository {
  findAllByUser(
    userId: number,
    options: PaginationOptions,
  ): Promise<PaginatedResult<OrderView>>;
  findById(userId: number, orderId: number): Promise<OrderView | null>;
  findAll(options: PaginationOptions): Promise<PaginatedResult<OrderView>>;
  findByIdForAdmin(orderId: number): Promise<OrderView | null>;
  deleteRemovable(orderId: number): Promise<boolean>;
  getInvoiceData(
    userId: number,
    orderId: number,
  ): Promise<PaymentSucceededEvent | null>;
  getInvoiceDataForAdmin(
    orderId: number,
  ): Promise<PaymentSucceededEvent | null>;
}
