import { Type } from 'class-transformer';
import {
  IsEnum,
  IsEmail,
  IsNumber,
  IsOptional,
  IsString,
  MinLength,
} from 'class-validator';
import { Role } from '../interfaces/user.interface';

export class CreateUserDto {
  @IsString()
  name!: string;

  @IsEmail()
  email!: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  age?: number;

  @IsEnum(Role)
  role!: Role;

  @IsString()
  @MinLength(6)
  password!: string;
}
