import type { Request } from 'express';
import type { CompanyRole } from '@prisma/client';

export interface AccessClaims {
  sub: string;
  sid: string;
}

export interface AuthContext {
  userId: string;
  sessionId: string;
  companyId?: string;
  companyRole?: CompanyRole;
}

export type AuthenticatedRequest = Request & { auth: AuthContext };
export type CompanyRequest = Request & {
  auth: AuthContext & { companyId: string; companyRole: CompanyRole };
};

export interface RequestMetadata {
  ipAddress?: string;
  userAgent?: string;
}
