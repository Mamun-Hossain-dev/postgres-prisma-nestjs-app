import { Transform, Type } from 'class-transformer';
import {
  IsBoolean,
  IsEnum,
  IsInt,
  IsNumber,
  IsObject,
  IsOptional,
  IsPositive,
  IsString,
  MaxLength,
  Min,
} from 'class-validator';
import { ProductCategory } from '../interfaces/product.interface';

export class CreateProductDto {
  @IsString()
  @MaxLength(160)
  title!: string;

  @IsOptional()
  @IsString()
  @MaxLength(180)
  slug?: string;

  @IsString()
  @MaxLength(80)
  sku!: string;

  @IsOptional()
  @IsString()
  @MaxLength(240)
  shortDescription?: string;

  @IsString()
  description!: string;

  @IsString()
  @MaxLength(80)
  brand!: string;

  @IsEnum(ProductCategory)
  category!: ProductCategory;

  @Type(() => Number)
  @IsNumber()
  @IsPositive()
  price!: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @IsPositive()
  compareAtPrice?: number;

  @Type(() => Number)
  @IsInt()
  @Min(0)
  quantity!: number;

  @IsOptional()
  @Transform(({ value }) => value === true || value === 'true')
  @IsBoolean()
  isFeatured?: boolean;

  @IsOptional()
  @Transform(({ value }) => {
    const input: unknown = value;
    if (typeof input !== 'string') return input;
    try {
      return JSON.parse(input) as unknown;
    } catch {
      return input;
    }
  })
  @IsObject()
  specifications?: Record<string, string>;
}
