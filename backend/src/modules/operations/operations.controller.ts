import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Public } from '../../common/decorators/public.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { RolesGuard } from '../../common/guards/roles.guard';
import { ResponseMessage } from '../../common/utils/api-response.util';
import type { PublicUser } from '../users/interfaces/user.interface';
import { Role } from '../users/interfaces/user.interface';
import {
  AdjustStockDto,
  CreateCouponDto,
  CreateReviewDto,
  InventoryQueryDto,
  ModerateReviewDto,
  ReviewQueryDto,
  UpdateCouponDto,
} from './dto/operations.dto';
import { OperationsService } from './operations.service';

@Controller('operations')
export class OperationsController {
  constructor(private readonly service: OperationsService) {}

  @Get('summary')
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN, Role.SELLER)
  getSummary() {
    return this.service.getSummary();
  }

  @Get('inventory')
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN, Role.SELLER)
  getInventory(@Query() query: InventoryQueryDto) {
    return this.service.getInventory(query);
  }

  @Patch('inventory/:id')
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN, Role.SELLER)
  @ResponseMessage('Stock adjusted successfully')
  adjustStock(
    @CurrentUser() user: PublicUser,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: AdjustStockDto,
  ) {
    return this.service.adjustStock(id, dto.quantity, user.id, dto.reason);
  }

  @Public()
  @Get('reviews/products/:productId')
  getProductReviews(@Param('productId', ParseIntPipe) productId: number) {
    return this.service.getProductReviews(productId);
  }

  @Post('reviews/products/:productId')
  @ResponseMessage('Review submitted for moderation')
  createReview(
    @CurrentUser() user: PublicUser,
    @Param('productId', ParseIntPipe) productId: number,
    @Body() dto: CreateReviewDto,
  ) {
    return this.service.createReview(user.id, productId, dto);
  }

  @Get('reviews')
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN)
  getReviews(@Query() query: ReviewQueryDto) {
    return this.service.getReviews(query);
  }

  @Patch('reviews/:id')
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN)
  @ResponseMessage('Review moderated successfully')
  moderateReview(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: ModerateReviewDto,
  ) {
    return this.service.moderateReview(id, dto.status);
  }

  @Get('coupons')
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN)
  getCoupons() {
    return this.service.getCoupons();
  }

  @Post('coupons')
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN)
  @ResponseMessage('Coupon created successfully')
  createCoupon(@Body() dto: CreateCouponDto) {
    return this.service.createCoupon(dto);
  }

  @Patch('coupons/:id')
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN)
  @ResponseMessage('Coupon updated successfully')
  updateCoupon(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateCouponDto,
  ) {
    return this.service.updateCoupon(id, dto);
  }

  @Delete('coupons/:id')
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN)
  @ResponseMessage('Coupon deleted successfully')
  async deleteCoupon(@Param('id', ParseIntPipe) id: number) {
    await this.service.deleteCoupon(id);
    return null;
  }
}
