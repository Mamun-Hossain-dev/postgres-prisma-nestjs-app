import { IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

export class CreateBroadcastDto {
  @IsString()
  @MinLength(3)
  @MaxLength(180)
  subject!: string;

  @IsOptional()
  @IsString()
  @MaxLength(240)
  previewText?: string;

  @IsString()
  @MinLength(10)
  @MaxLength(20_000)
  content!: string;
}
