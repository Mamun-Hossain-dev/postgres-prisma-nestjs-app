import { Body, Controller, Post } from '@nestjs/common';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { createApiResponse } from '../common/utils/api-response.util';
import { LoginDto } from './dto/login.dto';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  async register(@Body() dto: RegisterDto) {
    return createApiResponse(
      'User registered successfully',
      this.authService.register(dto),
    );
  }

  @Post('login')
  async login(@Body() dto: LoginDto) {
    const user = await this.authService.login(dto);
    return createApiResponse('Login successful', user);
  }
}
