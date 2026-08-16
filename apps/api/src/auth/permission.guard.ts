import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PERMISSION_KEY } from './auth.constants';
import { hasPermission, type CompanyPermission } from './permissions';
import type { AuthenticatedRequest } from './auth.types';

@Injectable()
export class PermissionGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const permission = this.reflector.getAllAndOverride<CompanyPermission>(
      PERMISSION_KEY,
      [context.getHandler(), context.getClass()],
    );
    if (!permission) return true;

    const { companyRole } = context
      .switchToHttp()
      .getRequest<AuthenticatedRequest>().auth;
    if (!companyRole || !hasPermission(companyRole, permission)) {
      throw new ForbiddenException(
        'Your company role does not allow this action',
      );
    }
    return true;
  }
}
