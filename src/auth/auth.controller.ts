import { Body, Controller, Get, Post } from '@nestjs/common';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { ResponseMessage } from '../common/utils/api-response.util';
import { LoginDto } from './dto/login.dto';

import { CurrentUser } from './decorators/current-user.decorator';
import type { PublicUser } from '../users/interfaces/user.interface';
import { Public } from './decorators/public.decorator';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Post('register')
  @ResponseMessage('User registered successfully')
  async register(@Body() dto: RegisterDto) {
    return this.authService.register(dto);
  }

  @Public()
  @Post('login')
  @ResponseMessage('Login successful')
  async login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
  }

  @Get('profile')
  @ResponseMessage('Authenticated user fetched successfully')
  getProfile(@CurrentUser() user: PublicUser) {
    return user;
  }
}
