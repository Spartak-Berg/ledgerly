import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { createHash, randomBytes, randomUUID } from 'node:crypto';
import { PrismaService } from '../prisma/prisma.service';
import { readEnvironment } from '../config/environment';
import {
  ACCESS_TOKEN_TTL_SECONDS,
  REFRESH_TOKEN_TTL_MS,
} from './auth.constants';
import type { AccessClaims, RequestMetadata } from './auth.types';

export interface SessionTokens {
  accessToken: string;
  csrfToken: string;
  refreshToken: string;
}

const tokenHash = (value: string) =>
  createHash('sha256').update(value).digest('hex');

@Injectable()
export class SessionService {
  private readonly environment = readEnvironment();

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
  ) {}

  async create(
    userId: string,
    metadata: RequestMetadata,
  ): Promise<SessionTokens> {
    const sessionId = randomUUID();
    const secret = randomBytes(32).toString('base64url');
    const refreshToken = `${sessionId}.${secret}`;
    const expiresAt = new Date(Date.now() + REFRESH_TOKEN_TTL_MS);
    await this.prisma.session.create({
      data: {
        id: sessionId,
        userId,
        tokenHash: tokenHash(refreshToken),
        expiresAt,
        ipAddress: metadata.ipAddress,
        userAgent: metadata.userAgent?.slice(0, 500),
      },
    });
    return this.issueTokens(userId, sessionId, refreshToken);
  }

  async rotate(
    refreshToken: string,
  ): Promise<{ userId: string; tokens: SessionTokens }> {
    const [sessionId] = refreshToken.split('.');
    if (!sessionId)
      throw new UnauthorizedException('Session is invalid or expired');

    const session = await this.prisma.session.findUnique({
      where: { id: sessionId },
    });
    if (!session || session.revokedAt || session.expiresAt <= new Date()) {
      throw new UnauthorizedException('Session is invalid or expired');
    }

    const nextRefresh = `${session.id}.${randomBytes(32).toString('base64url')}`;
    const rotated = await this.prisma.session.updateMany({
      where: {
        id: session.id,
        tokenHash: tokenHash(refreshToken),
        revokedAt: null,
        expiresAt: { gt: new Date() },
      },
      data: {
        tokenHash: tokenHash(nextRefresh),
        expiresAt: new Date(Date.now() + REFRESH_TOKEN_TTL_MS),
        lastUsedAt: new Date(),
      },
    });
    if (rotated.count !== 1) {
      await this.prisma.session.updateMany({
        where: { id: session.id, revokedAt: null },
        data: { revokedAt: new Date() },
      });
      throw new UnauthorizedException('Session is invalid or expired');
    }

    return {
      userId: session.userId,
      tokens: await this.issueTokens(session.userId, session.id, nextRefresh),
    };
  }

  revoke(sessionId: string) {
    return this.prisma.session.updateMany({
      where: { id: sessionId, revokedAt: null },
      data: { revokedAt: new Date() },
    });
  }

  async validateAccess(token: string): Promise<AccessClaims> {
    let claims: AccessClaims;
    try {
      claims = await this.jwt.verifyAsync<AccessClaims>(token, {
        algorithms: ['HS256'],
        audience: 'ledgerly-web',
        issuer: 'ledgerly-api',
        secret: this.environment.accessTokenSecret,
      });
    } catch {
      throw new UnauthorizedException('Authentication is required');
    }

    const activeSession = await this.prisma.session.findFirst({
      where: {
        id: claims.sid,
        userId: claims.sub,
        revokedAt: null,
        expiresAt: { gt: new Date() },
      },
      select: { id: true },
    });
    if (!activeSession)
      throw new UnauthorizedException('Authentication is required');
    return claims;
  }

  private async issueTokens(
    userId: string,
    sessionId: string,
    refreshToken: string,
  ): Promise<SessionTokens> {
    const accessToken = await this.jwt.signAsync(
      { sub: userId, sid: sessionId } satisfies AccessClaims,
      {
        algorithm: 'HS256',
        audience: 'ledgerly-web',
        expiresIn: ACCESS_TOKEN_TTL_SECONDS,
        issuer: 'ledgerly-api',
        secret: this.environment.accessTokenSecret,
      },
    );
    return {
      accessToken,
      csrfToken: randomBytes(24).toString('base64url'),
      refreshToken,
    };
  }
}
