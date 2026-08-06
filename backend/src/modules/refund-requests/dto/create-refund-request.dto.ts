import { Type } from 'class-transformer';
import { IsInt, IsString, Length, Min } from 'class-validator';

export class CreateRefundRequestDto {
  @Type(() => Number)
  @IsInt()
  @Min(1)
  orderId!: number;

  @IsString()
  @Length(3, 500)
  reason!: string;
}
