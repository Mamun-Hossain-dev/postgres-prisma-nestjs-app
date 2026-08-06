import { IsInt, IsOptional, IsString, MaxLength, Min } from 'class-validator';

export class DecideRefundRequestDto {
  @IsOptional()
  @IsString()
  @MaxLength(500)
  note?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  amount?: number;
}
