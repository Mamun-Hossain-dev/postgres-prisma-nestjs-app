import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsDateString,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  Length,
  Max,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';
import { PaginationQueryDto } from '../../../common/dto/pagination-query.dto';

export class InventoryQueryDto extends PaginationQueryDto {
  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsIn(['all', 'low', 'out'])
  stock: 'all' | 'low' | 'out' = 'all';
}

export class AdjustStockDto {
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(1_000_000)
  quantity!: number;

  @IsString()
  @Length(3, 200)
  reason!: string;
}

export class ReviewQueryDto extends PaginationQueryDto {
  @IsOptional()
  @IsIn(['PENDING', 'APPROVED', 'REJECTED'])
  status?: 'PENDING' | 'APPROVED' | 'REJECTED';
}

export class CreateReviewDto {
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(5)
  rating!: number;

  @IsString()
  @Length(3, 100)
  title!: string;

  @IsString()
  @Length(10, 2000)
  comment!: string;
}

export class ModerateReviewDto {
  @IsIn(['APPROVED', 'REJECTED'])
  status!: 'APPROVED' | 'REJECTED';
}

export class CreateCouponDto {
  @IsString()
  @Length(3, 32)
  code!: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  description?: string;

  @IsIn(['PERCENTAGE', 'FIXED'])
  type!: 'PERCENTAGE' | 'FIXED';

  @Type(() => Number)
  @IsInt()
  @Min(1)
  value!: number;

  @Type(() => Number)
  @IsInt()
  @Min(0)
  minimumAmount = 0;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  usageLimit?: number;

  @IsOptional()
  @IsBoolean()
  isActive = true;

  @IsOptional()
  @IsDateString()
  startsAt?: string;

  @IsOptional()
  @IsDateString()
  endsAt?: string;
}

export class UpdateCouponDto {
  @IsOptional()
  @IsString()
  @Length(3, 32)
  code?: string;

  @IsOptional()
  @IsString()
  @MinLength(1)
  description?: string;

  @IsOptional()
  @IsIn(['PERCENTAGE', 'FIXED'])
  type?: 'PERCENTAGE' | 'FIXED';

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  value?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  minimumAmount?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  usageLimit?: number;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @IsOptional()
  @IsDateString()
  startsAt?: string;

  @IsOptional()
  @IsDateString()
  endsAt?: string;
}
