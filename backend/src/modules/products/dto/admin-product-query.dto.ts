import { IsEnum, IsOptional } from 'class-validator';
import { ProductStatus } from '../interfaces/product.interface';
import { ProductQueryDto } from './product-query.dto';

export class AdminProductQueryDto extends ProductQueryDto {
  @IsOptional()
  @IsEnum(ProductStatus)
  status?: ProductStatus;
}
