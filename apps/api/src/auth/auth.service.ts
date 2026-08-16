import {
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { randomBytes } from 'node:crypto';
import { PrismaService } from '../prisma/prisma.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { PasswordService } from './password.service';
import { SessionService, type SessionTokens } from './session.service';
import type { RequestMetadata } from './auth.types';

const normalizeEmail = (email: string) => email.trim().toLowerCase();
const clean = (value: string) => value.trim().replace(/\s+/g, ' ');
const slugify = (value: string) =>
  value
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '') || 'company';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly passwords: PasswordService,
    private readonly sessions: SessionService,
  ) {}

  async register(dto: RegisterDto, metadata: RequestMetadata) {
    const passwordHash = await this.passwords.hash(dto.password);
    const companyName = clean(dto.companyName);
    const slug = `${slugify(companyName)}-${randomBytes(4).toString('hex')}`;

    try {
      const user = await this.prisma.$transaction(async (transaction) => {
        const createdUser = await transaction.user.create({
          data: {
            email: normalizeEmail(dto.email),
            fullName: clean(dto.fullName),
            passwordHash,
          },
        });
        const company = await transaction.company.create({
          data: {
            name: companyName,
            slug,
            settings: { create: {} },
          },
        });
        await transaction.companyMember.create({
          data: {
            companyId: company.id,
            role: 'OWNER',
            userId: createdUser.id,
          },
        });
        return createdUser;
      });
      return this.authenticate(user.id, metadata);
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        throw new ConflictException(
          'An account with this email already exists',
        );
      }
      throw error;
    }
  }

  async login(dto: LoginDto, metadata: RequestMetadata) {
    const user = await this.prisma.user.findUnique({
      where: { email: normalizeEmail(dto.email) },
    });
    const valid = user
      ? await this.passwords.verify(dto.password, user.passwordHash)
      : await this.passwords.verify(
          dto.password,
          'scrypt:00000000000000000000000000000000:' + '00'.repeat(64),
        );
    if (!user || !valid) {
      throw new UnauthorizedException('Email or password is incorrect');
    }
    return this.authenticate(user.id, metadata);
  }

  async profile(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        fullName: true,
        memberships: {
          orderBy: { createdAt: 'asc' },
          take: 1,
          select: {
            role: true,
            company: {
              select: { id: true, name: true, defaultCurrency: true },
            },
          },
        },
      },
    });
    if (!user || !user.memberships[0]) {
      throw new UnauthorizedException('Account has no available company');
    }
    const membership = user.memberships[0];
    return {
      user: { id: user.id, email: user.email, fullName: user.fullName },
      company: { ...membership.company, role: membership.role },
    };
  }

  private async authenticate(userId: string, metadata: RequestMetadata) {
    const [profile, tokens] = await Promise.all([
      this.profile(userId),
      this.sessions.create(userId, metadata),
    ]);
    return { profile, tokens };
  }
}

export interface AuthResult {
  profile: Awaited<ReturnType<AuthService['profile']>>;
  tokens: SessionTokens;
}
