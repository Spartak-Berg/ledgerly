import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import type { CompanyRole, Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CompanyPermission, hasPermission } from '../auth/permissions';
import { UpdateCompanyDto } from './dto/update-company.dto';

const companySelect = {
  id: true,
  name: true,
  organisationNumber: true,
  email: true,
  phone: true,
  website: true,
  addressLine1: true,
  addressLine2: true,
  postalCode: true,
  city: true,
  countryCode: true,
  defaultCurrency: true,
  vatRegistered: true,
  vatNumber: true,
  bankAccount: true,
  iban: true,
  bic: true,
  settings: {
    select: {
      defaultPaymentDays: true,
      defaultVatRate: true,
      financialYearStartMonth: true,
    },
  },
} satisfies Prisma.CompanySelect;

type CompanyView = Prisma.CompanyGetPayload<{ select: typeof companySelect }>;

const toView = (company: CompanyView, role: CompanyRole) => ({
  ...company,
  role,
  settings: {
    ...company.settings,
    defaultVatRate: Number(company.settings?.defaultVatRate ?? 25),
  },
});

@Injectable()
export class CompaniesService {
  constructor(private readonly prisma: PrismaService) {}

  async list(userId: string) {
    const memberships = await this.prisma.companyMember.findMany({
      where: { userId },
      orderBy: { createdAt: 'asc' },
      select: {
        role: true,
        company: { select: { id: true, name: true, defaultCurrency: true } },
      },
    });
    return memberships.map(({ company, role }) => ({ ...company, role }));
  }

  async select(userId: string, companyId: string) {
    await this.membership(userId, companyId);
    await this.prisma.user.update({
      where: { id: userId },
      data: { selectedCompanyId: companyId },
    });
  }

  async get(userId: string, companyId: string) {
    const membership = await this.membership(userId, companyId);
    const company = await this.prisma.company.findUnique({
      where: { id: companyId },
      select: companySelect,
    });
    if (!company) throw new NotFoundException('Company was not found');
    return toView(company, membership.role);
  }

  async update(userId: string, companyId: string, dto: UpdateCompanyDto) {
    const membership = await this.membership(userId, companyId);
    if (!hasPermission(membership.role, CompanyPermission.MANAGE_COMPANY)) {
      throw new ForbiddenException('Your company role cannot update settings');
    }

    const {
      defaultPaymentDays,
      defaultVatRate,
      financialYearStartMonth,
      ...companyData
    } = dto;
    const settingsData = {
      ...(defaultPaymentDays === undefined ? {} : { defaultPaymentDays }),
      ...(defaultVatRate === undefined ? {} : { defaultVatRate }),
      ...(financialYearStartMonth === undefined
        ? {}
        : { financialYearStartMonth }),
    };
    const company = await this.prisma.$transaction(async (transaction) => {
      await transaction.company.update({
        where: { id: companyId },
        data: companyData,
      });
      if (Object.keys(settingsData).length) {
        await transaction.companySettings.update({
          where: { companyId },
          data: settingsData,
        });
      }
      return transaction.company.findUniqueOrThrow({
        where: { id: companyId },
        select: companySelect,
      });
    });
    return toView(company, membership.role);
  }

  private async membership(userId: string, companyId: string) {
    const membership = await this.prisma.companyMember.findUnique({
      where: { userId_companyId: { companyId, userId } },
      select: { role: true },
    });
    if (!membership) throw new NotFoundException('Company was not found');
    return membership;
  }
}
