import type { PaginationQueryDto } from '../../../common/dto/pagination-query.dto';
import type { AnalyticsOverview } from '../interfaces/analytics.interface';
import type {
  CreateCouponDto,
  CreateReviewDto,
  InventoryQueryDto,
  ReviewQueryDto,
  UpdateCouponDto,
} from '../dto/operations.dto';

export interface OperationsRepository {
  getInventory(query: InventoryQueryDto): Promise<unknown>;
  getProductMovements(
    productId: number,
    query: PaginationQueryDto,
  ): Promise<unknown>;
  getAnalytics(): Promise<AnalyticsOverview>;
  createReview(
    userId: number,
    productId: number,
    input: CreateReviewDto,
  ): Promise<unknown>;
  getProductReviews(productId: number): Promise<unknown>;
  getReviews(query: ReviewQueryDto): Promise<unknown>;
  moderateReview(id: number, status: 'APPROVED' | 'REJECTED'): Promise<unknown>;
  getCoupons(): Promise<unknown>;
  getAvailableCoupons(): Promise<unknown>;
  createCoupon(input: CreateCouponDto): Promise<unknown>;
  updateCoupon(id: number, input: UpdateCouponDto): Promise<unknown>;
  deleteCoupon(id: number): Promise<void>;
}
