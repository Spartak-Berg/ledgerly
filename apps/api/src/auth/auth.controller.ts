import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Req,
  Res,
  UnauthorizedException,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import type { Request, Response } from 'express';
import { readEnvironment } from '../config/environment';
import {
  ACCESS_COOKIE,
  ACCESS_TOKEN_TTL_SECONDS,
  CSRF_COOKIE,
  REFRESH_COOKIE,
  REFRESH_TOKEN_TTL_MS,
} from './auth.constants';
import { Public, SkipCompanyContext, SkipCsrf } from './auth.decorators';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { SessionService, type SessionTokens } from './session.service';
import type { AuthenticatedRequest, RequestMetadata } from './auth.types';

const environment = readEnvironment();
const cookieBase = {
  secure: environment.isProduction,
  sameSite: 'strict' as const,
};
const requestMetadata = (request: Request): RequestMetadata => ({
  ipAddress: request.ip,
  userAgent: request.header('user-agent'),
});
const cookieValue = (request: Request, name: string) =>
  ((request.cookies ?? {}) as Record<string, string | undefined>)[name];

@Controller('auth')
@SkipCompanyContext()
export class AuthController {
  constructor(
    private readonly auth: AuthService,
    private readonly sessions: SessionService,
  ) {}

  @Public()
  @SkipCsrf()
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  @Post('register')
  async register(
    @Body() dto: RegisterDto,
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response,
  ) {
    const result = await this.auth.register(dto, requestMetadata(request));
    this.setCookies(response, result.tokens);
    return result.profile;
  }

  @Public()
  @SkipCsrf()
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  @Post('login')
  async login(
    @Body() dto: LoginDto,
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response,
  ) {
    const result = await this.auth.login(dto, requestMetadata(request));
    this.setCookies(response, result.tokens);
    return result.profile;
  }

  @Get('me')
  me(@Req() request: AuthenticatedRequest) {
    return this.auth.profile(request.auth.userId);
  }

  @Public()
  @HttpCode(HttpStatus.OK)
  @Post('refresh')
  async refresh(
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response,
  ) {
    const refreshToken = cookieValue(request, REFRESH_COOKIE);
    if (!refreshToken)
      throw new UnauthorizedException('Session is invalid or expired');
    const result = await this.sessions.rotate(refreshToken);
    this.setCookies(response, result.tokens);
    return this.auth.profile(result.userId);
  }

  @HttpCode(HttpStatus.NO_CONTENT)
  @Post('logout')
  async logout(
    @Req() request: AuthenticatedRequest,
    @Res({ passthrough: true }) response: Response,
  ): Promise<void> {
    await this.sessions.revoke(request.auth.sessionId);
    this.clearCookies(response);
  }

  private setCookies(response: Response, tokens: SessionTokens): void {
    response.cookie(ACCESS_COOKIE, tokens.accessToken, {
      ...cookieBase,
      httpOnly: true,
      maxAge: ACCESS_TOKEN_TTL_SECONDS * 1000,
      path: '/',
    });
    response.cookie(REFRESH_COOKIE, tokens.refreshToken, {
      ...cookieBase,
      httpOnly: true,
      maxAge: REFRESH_TOKEN_TTL_MS,
      path: '/api/v1/auth',
    });
    response.cookie(CSRF_COOKIE, tokens.csrfToken, {
      ...cookieBase,
      httpOnly: false,
      maxAge: REFRESH_TOKEN_TTL_MS,
      path: '/',
    });
  }

  private clearCookies(response: Response): void {
    response.clearCookie(ACCESS_COOKIE, {
      ...cookieBase,
      httpOnly: true,
      path: '/',
    });
    response.clearCookie(REFRESH_COOKIE, {
      ...cookieBase,
      httpOnly: true,
      path: '/api/v1/auth',
    });
    response.clearCookie(CSRF_COOKIE, { ...cookieBase, path: '/' });
  }
}
