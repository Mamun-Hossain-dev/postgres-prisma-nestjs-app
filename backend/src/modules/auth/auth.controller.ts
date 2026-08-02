import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Req,
  Res,
} from '@nestjs/common';
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
import { GoogleAuthDto } from './dto/google-auth.dto';
import { AuthSessionService } from './auth-session.service';

@Controller('auth')
export class AuthController {
  private readonly refreshCookieName: string;
  private readonly isProduction: boolean;
  private readonly refreshCookiePath: string;

  constructor(
    private readonly authService: AuthService,
    private readonly authSessionService: AuthSessionService,
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
  @Throttle({ default: { limit: 15, ttl: 60_000 } })
  @Post('google')
  @ResponseMessage('Google authentication successful')
  async google(
    @Body() dto: GoogleAuthDto,
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response,
  ) {
    const result = await this.authService.loginWithGoogle(
      dto.idToken,
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

  @Get('sessions')
  @ResponseMessage('Active sessions fetched successfully')
  sessions(@CurrentUser() user: PublicUser, @Req() request: Request) {
    return this.authSessionService.list(
      user.id,
      getCookie(request, this.refreshCookieName) ?? undefined,
    );
  }

  @Delete('sessions/:id')
  @ResponseMessage('Session revoked successfully')
  async revokeSession(
    @CurrentUser() user: PublicUser,
    @Param('id') id: string,
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response,
  ) {
    await this.authSessionService.revokeSession(user.id, id);
    const currentId = this.authSessionService.tokenSessionId(
      getCookie(request, this.refreshCookieName) ?? undefined,
    );
    if (currentId === id) this.clearRefreshCookie(response);
    return null;
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
