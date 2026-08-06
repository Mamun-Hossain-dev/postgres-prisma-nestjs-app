import type { PaginatedResult } from '../../../common/interfaces/pagination.interface';
import type {
  RefundableOrder,
  RefundRequestListQuery,
  RefundRequestView,
} from '../interfaces/refund-request.interface';

export interface RefundRequestRepository {
  create(
    userId: number,
    orderId: number,
    reason: string,
  ): Promise<RefundRequestView>;
  findById(requestId: number): Promise<RefundRequestView | null>;
  findOwnedById(
    userId: number,
    requestId: number,
  ): Promise<RefundRequestView | null>;
  findActiveForOrder(orderId: number): Promise<RefundRequestView | null>;
  findRefundableOrder(
    userId: number,
    orderId: number,
  ): Promise<RefundableOrder | null>;
  findAllForUser(
    userId: number,
    query: RefundRequestListQuery,
  ): Promise<PaginatedResult<RefundRequestView>>;
  findAllForAdmin(
    query: RefundRequestListQuery,
  ): Promise<PaginatedResult<RefundRequestView>>;
  approve(
    requestId: number,
    adminId: number,
    refundId: number,
    note: string | null,
  ): Promise<RefundRequestView | null>;
  deny(
    requestId: number,
    adminId: number,
    note: string | null,
  ): Promise<RefundRequestView | null>;
}
