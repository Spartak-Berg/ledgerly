import {
  BadRequestException,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PrismaService } from '../prisma/prisma.service';
import { IS_PUBLIC_KEY, SKIP_COMPANY_KEY } from './auth.constants';
import type { AuthenticatedRequest } from './auth.types';

const UUID =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

@Injectable()
export class CompanyContextGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly prisma: PrismaService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const targets = [context.getHandler(), context.getClass()];
    const skip =
      this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, targets) ||
      this.reflector.getAllAndOverride<boolean>(SKIP_COMPANY_KEY, targets);
    if (skip) return true;

    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const companyId = request.header('x-company-id');
    if (!companyId || !UUID.test(companyId)) {
      throw new BadRequestException('A valid X-Company-Id header is required');
    }
    const membership = await this.prisma.companyMember.findUnique({
      where: { userId_companyId: { companyId, userId: request.auth.userId } },
      select: { role: true },
    });
    if (!membership) {
      throw new ForbiddenException('Company access is not allowed');
    }

    request.auth.companyId = companyId;
    request.auth.companyRole = membership.role;
    return true;
  }
}
