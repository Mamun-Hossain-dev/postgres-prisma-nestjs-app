import { Type } from 'class-transformer';
import { IsNumber, IsOptional, IsString, MinLength } from 'class-validator';

export class CreateUserDto {
  @IsString()
  name!: string;

  @IsString()
  email!: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  age?: number;

  @IsString()
  @MinLength(6)
  password!: string;
}
