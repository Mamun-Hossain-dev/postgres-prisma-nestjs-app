import { IsIn } from 'class-validator';
import type { OrderStatus } from '../../payments/interfaces/payment.interface';

export const adminOrderStatuses = [
  'PROCESSING',
  'SHIPPED',
  'DELIVERED',
  'CANCELLED',
] as const satisfies readonly OrderStatus[];

export class UpdateOrderStatusDto {
  @IsIn(adminOrderStatuses)
  status!: (typeof adminOrderStatuses)[number];
}
