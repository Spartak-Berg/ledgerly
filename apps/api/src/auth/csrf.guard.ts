import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { Request } from 'express';
import { timingSafeEqual } from 'node:crypto';
import { CSRF_COOKIE, SKIP_CSRF_KEY } from './auth.constants';
import { readEnvironment } from '../config/environment';

const SAFE_METHODS = new Set(['GET', 'HEAD', 'OPTIONS']);

@Injectable()
export class CsrfGuard implements CanActivate {
  private readonly environment = readEnvironment();

  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<Request>();
    if (SAFE_METHODS.has(request.method)) return true;
    const skip = this.reflector.getAllAndOverride<boolean>(SKIP_CSRF_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (skip) {
      const origin = request.header('origin');
      if (origin && origin !== this.environment.webOrigin) {
        throw new ForbiddenException('Request origin is not allowed');
      }
      return true;
    }

    const cookie = (
      (request.cookies ?? {}) as Record<string, string | undefined>
    )[CSRF_COOKIE];
    const header = request.header('x-csrf-token');
    if (!cookie || !header)
      throw new ForbiddenException('CSRF validation failed');

    const cookieBuffer = Buffer.from(cookie);
    const headerBuffer = Buffer.from(header);
    if (
      cookieBuffer.length !== headerBuffer.length ||
      !timingSafeEqual(cookieBuffer, headerBuffer)
    ) {
      throw new ForbiddenException('CSRF validation failed');
    }
    return true;
  }
}
