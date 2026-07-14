import { IsEmail, IsEnum, IsString, MinLength } from 'class-validator';
import { Role } from '../../users/interfaces/user.interface';

export class RegisterDto {
  @IsString()
  name!: string;

  @IsEmail()
  email!: string;

  @IsEnum(Role)
  role!: Role;

  @MinLength(6)
  password!: string;
}
