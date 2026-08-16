import type { Request } from 'express';

export interface AccessClaims {
  sub: string;
  sid: string;
}

export interface AuthContext {
  userId: string;
  sessionId: string;
}

export type AuthenticatedRequest = Request & { auth: AuthContext };

export interface RequestMetadata {
  ipAddress?: string;
  userAgent?: string;
}
