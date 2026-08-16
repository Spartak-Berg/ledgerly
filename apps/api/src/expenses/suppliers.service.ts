import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { SupplierDto, SupplierListQueryDto } from './dto/expense.dto';

const text = (value?: string | null) => value?.trim() || null;

@Injectable()
export class SuppliersService {
  constructor(private readonly prisma: PrismaService) {}

  async list(companyId: string, query: SupplierListQueryDto) {
    const search = query.search?.trim();
    const suppliers = await this.prisma.supplier.findMany({
      where: {
        companyId,
        ...(query.active ? { active: true } : {}),
        ...(search
          ? {
              OR: [
                { name: { contains: search, mode: 'insensitive' as const } },
                {
                  organisationNumber: {
                    contains: search,
                    mode: 'insensitive' as const,
                  },
                },
              ],
            }
          : {}),
      },
      orderBy: { name: 'asc' },
    });
    const totals = await this.prisma.expense.groupBy({
      by: ['supplierId'],
      where: {
        companyId,
        supplierId: { in: suppliers.map((supplier) => supplier.id) },
        archivedAt: null,
      },
      _count: { _all: true },
      _sum: { totalMinor: true },
    });
    const history = new Map(
      totals.map((item) => [item.supplierId, item] as const),
    );
    return suppliers.map((supplier) => ({
      ...supplier,
      expenseCount: history.get(supplier.id)?._count._all ?? 0,
      totalExpenseMinor: history.get(supplier.id)?._sum.totalMinor ?? 0,
    }));
  }

  async get(companyId: string, id: string) {
    const supplier = await this.prisma.supplier.findFirst({
      where: { id, companyId },
      include: {
        expenses: {
          where: { archivedAt: null },
          orderBy: { expenseDate: 'desc' },
          take: 20,
          include: { category: { select: { id: true, name: true } } },
        },
      },
    });
    if (!supplier) throw new NotFoundException('Supplier was not found');
    return supplier;
  }

  create(companyId: string, dto: SupplierDto) {
    return this.prisma.supplier.create({ data: this.data(companyId, dto) });
  }

  async update(companyId: string, id: string, dto: SupplierDto) {
    await this.get(companyId, id);
    return this.prisma.supplier.update({
      where: { id },
      data: this.data(companyId, dto),
    });
  }

  async archive(companyId: string, id: string) {
    await this.get(companyId, id);
    return this.prisma.supplier.update({
      where: { id },
      data: { active: false, archivedAt: new Date() },
    });
  }

  private data(companyId: string, dto: SupplierDto) {
    return {
      companyId,
      name: dto.name.trim(),
      organisationNumber: text(dto.organisationNumber),
      email: text(dto.email)?.toLowerCase() ?? null,
      phone: text(dto.phone),
      addressLine1: text(dto.addressLine1),
      postalCode: text(dto.postalCode),
      city: text(dto.city),
      countryCode: dto.countryCode,
      notes: text(dto.notes),
    };
  }
}
