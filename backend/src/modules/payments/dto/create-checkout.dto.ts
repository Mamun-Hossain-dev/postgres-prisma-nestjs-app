import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsIn,
  IsInt,
  IsEmail,
  IsUUID,
  IsOptional,
  IsString,
  Length,
  Min,
  MaxLength,
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

  @IsString()
  @Length(2, 100)
  customerName!: string;

  @IsEmail()
  @MaxLength(254)
  customerEmail!: string;

  @IsString()
  @Length(7, 30)
  customerPhone!: string;

  @IsString()
  @Length(5, 240)
  deliveryAddressLine!: string;

  @IsString()
  @Length(2, 100)
  deliveryArea!: string;

  @IsString()
  @Length(2, 100)
  deliveryCity!: string;

  @IsOptional()
  @IsString()
  @MaxLength(20)
  deliveryPostalCode?: string;

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
