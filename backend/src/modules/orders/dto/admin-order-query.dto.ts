import { IsIn, IsOptional, IsString, Length } from 'class-validator';
import { PaginationQueryDto } from '../../../common/dto/pagination-query.dto';
import type { OrderStatus } from '../../payments/interfaces/payment.interface';

const adminOrderFilterStatuses = [
  'PAYMENT_PENDING',
  'PAYMENT_PROCESSING',
  'PAYMENT_FAILED',
  'PAID',
  'COD_CONFIRMED',
  'PROCESSING',
  'SHIPPED',
  'DELIVERED',
  'CANCELLED',
] as const satisfies readonly OrderStatus[];

export class AdminOrderQueryDto extends PaginationQueryDto {
  @IsOptional()
  @IsString()
  @Length(2, 100)
  search?: string;

  @IsOptional()
  @IsIn(adminOrderFilterStatuses)
  status?: (typeof adminOrderFilterStatuses)[number];
}
