import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsIn,
  IsInt,
  IsUUID,
  IsOptional,
  IsString,
  Length,
  Min,
  ValidateNested,
} from 'class-validator';
import type {
  CheckoutPaymentMethod,
  DeliveryZone,
} from '../interfaces/payment.interface';

const checkoutPaymentMethods = ['CARD', 'CASH_ON_DELIVERY'] as const;
const deliveryZones = ['DHAKA', 'OUTSIDE_DHAKA'] as const;

export class CheckoutItemDto {
  @IsInt()
  @Min(1)
  productId!: number;

  @IsInt()
  @Min(1)
  quantity!: number;
}

export class CreateCheckoutDto {
  @IsUUID()
  idempotencyKey!: string;

  @IsIn(checkoutPaymentMethods)
  paymentMethod!: CheckoutPaymentMethod;

  @IsIn(deliveryZones)
  deliveryZone!: DeliveryZone;

  @IsOptional()
  @IsString()
  @Length(3, 32)
  couponCode?: string;

  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(50)
  @ValidateNested({ each: true })
  @Type(() => CheckoutItemDto)
  items!: CheckoutItemDto[];
}
