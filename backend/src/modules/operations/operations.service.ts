import { Inject, Injectable } from '@nestjs/common';
import { AppException } from '../../common/exceptions/app.exception';
import { ProductsService } from '../products/products.service';
import { OPERATIONS_REPOSITORY } from './constants/operations.tokens';
import type {
  CreateCouponDto,
  CreateReviewDto,
  InventoryQueryDto,
  ReviewQueryDto,
  UpdateCouponDto,
} from './dto/operations.dto';
import type { OperationsRepository } from './repositories/operations.repository';

@Injectable()
export class OperationsService {
  constructor(
    @Inject(OPERATIONS_REPOSITORY)
    private readonly repository: OperationsRepository,
    private readonly productsService: ProductsService,
  ) {}

  getSummary() {
    return this.productsService.getOperationsSummary();
  }

  getInventory(query: InventoryQueryDto) {
    return this.repository.getInventory(query);
  }

  adjustStock(
    productId: number,
    quantity: number,
    adjustedById: number,
    reason: string,
  ) {
    return this.productsService.adjustStock(
      productId,
      quantity,
      adjustedById,
      reason,
    );
  }

  createReview(userId: number, productId: number, input: CreateReviewDto) {
    return this.repository.createReview(userId, productId, input);
  }

  getProductReviews(productId: number) {
    return this.repository.getProductReviews(productId);
  }

  getReviews(query: ReviewQueryDto) {
    return this.repository.getReviews(query);
  }

  moderateReview(id: number, status: 'APPROVED' | 'REJECTED') {
    return this.repository.moderateReview(id, status);
  }

  getCoupons() {
    return this.repository.getCoupons();
  }

  getAvailableCoupons() {
    return this.repository.getAvailableCoupons();
  }

  createCoupon(input: CreateCouponDto) {
    this.validateCoupon(input);
    return this.repository.createCoupon(input);
  }

  updateCoupon(id: number, input: UpdateCouponDto) {
    this.validateCoupon(input);
    return this.repository.updateCoupon(id, input);
  }

  deleteCoupon(id: number) {
    return this.repository.deleteCoupon(id);
  }

  private validateCoupon(input: CreateCouponDto | UpdateCouponDto) {
    if (input.type === 'PERCENTAGE' && input.value && input.value > 100) {
      throw new AppException('Percentage discount cannot exceed 100', {
        code: 'INVALID_COUPON_VALUE',
        status: 400,
      });
    }
    if (
      input.startsAt &&
      input.endsAt &&
      new Date(input.startsAt) >= new Date(input.endsAt)
    ) {
      throw new AppException('Coupon end must be after its start', {
        code: 'INVALID_COUPON_WINDOW',
        status: 400,
      });
    }
  }
}
