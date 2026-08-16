import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { Request } from 'express';
import { ACCESS_COOKIE, IS_PUBLIC_KEY } from './auth.constants';
import { SessionService } from './session.service';
import type { AuthenticatedRequest } from './auth.types';

const cookies = (request: Request): Record<string, string | undefined> =>
  (request.cookies ?? {}) as Record<string, string | undefined>;

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly sessions: SessionService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) return true;

    const request = context.switchToHttp().getRequest<Request>();
    const token = cookies(request)[ACCESS_COOKIE];
    if (!token) throw new UnauthorizedException('Authentication is required');
    const claims = await this.sessions.validateAccess(token);
    (request as AuthenticatedRequest).auth = {
      sessionId: claims.sid,
      userId: claims.sub,
    };
    return true;
  }
}
