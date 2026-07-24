import { Body, Controller, Get, Post, Req, Res } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Throttle } from '@nestjs/throttler';
import type { Request, Response } from 'express';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { ResponseMessage } from '../../common/utils/api-response.util';
import { LoginDto } from './dto/login.dto';

import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { PublicUser } from '../users/interfaces/user.interface';
import { Public } from '../../common/decorators/public.decorator';
import { getCookie, getRequestMetadata } from './utils/request-metadata.util';
import type { AuthSessionResult } from './interfaces/auth.interface';
import { AppException } from '../../common/exceptions/app.exception';

@Controller('auth')
export class AuthController {
  private readonly refreshCookieName: string;
  private readonly isProduction: boolean;
  private readonly refreshCookiePath: string;

  constructor(
    private readonly authService: AuthService,
    configService: ConfigService,
  ) {
    this.refreshCookieName = configService.getOrThrow<string>(
      'auth.refreshCookieName',
    );
    this.isProduction = configService.getOrThrow<boolean>('app.isProduction');
    const apiPrefix = configService
      .getOrThrow<string>('app.globalPrefix')
      .replace(/^\/+|\/+$/g, '');
    this.refreshCookiePath = `/${apiPrefix}/auth`;
  }

  @Public()
  @Throttle({ default: { limit: 15, ttl: 60_000 } })
  @Post('register')
  @ResponseMessage('User registered successfully')
  async register(@Body() dto: RegisterDto) {
    return this.authService.register(dto);
  }

  @Public()
  @Throttle({ default: { limit: 15, ttl: 60_000 } })
  @Post('login')
  @ResponseMessage('Login successful')
  async login(
    @Body() dto: LoginDto,
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response,
  ) {
    const result = await this.authService.login(
      dto,
      getRequestMetadata(request),
    );
    this.setRefreshCookie(response, result);
    return result.auth;
  }

  @Public()
  @Throttle({ default: { limit: 30, ttl: 60_000 } })
  @Post('refresh')
  @ResponseMessage('Token refreshed successfully')
  async refresh(
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response,
  ) {
    const result = await this.authService.refresh(
      this.requireRefreshToken(request),
      getRequestMetadata(request),
    );
    this.setRefreshCookie(response, result);
    return result.auth;
  }

  @Public()
  @Post('logout')
  @ResponseMessage('Logout successful')
  async logout(
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response,
  ) {
    const refreshToken = getCookie(request, this.refreshCookieName);
    if (refreshToken) await this.authService.logout(refreshToken);
    this.clearRefreshCookie(response);
    return null;
  }

  @Get('profile')
  @ResponseMessage('Authenticated user fetched successfully')
  getProfile(@CurrentUser() user: PublicUser) {
    return user;
  }

  private requireRefreshToken(request: Request): string {
    const refreshToken = getCookie(request, this.refreshCookieName);
    if (!refreshToken) {
      throw new AppException('Refresh token cookie is required', {
        code: 'REFRESH_TOKEN_REQUIRED',
        status: 401,
      });
    }
    return refreshToken;
  }

  private setRefreshCookie(response: Response, result: AuthSessionResult) {
    response.cookie(this.refreshCookieName, result.refreshToken, {
      httpOnly: true,
      secure: this.isProduction,
      sameSite: 'strict',
      path: this.refreshCookiePath,
      expires: result.refreshTokenExpiresAt,
    });
  }

  private clearRefreshCookie(response: Response) {
    response.clearCookie(this.refreshCookieName, {
      httpOnly: true,
      secure: this.isProduction,
      sameSite: 'strict',
      path: this.refreshCookiePath,
    });
  }
}
