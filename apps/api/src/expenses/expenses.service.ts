import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ExpenseStatus, Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import {
  ExpenseDto,
  ExpenseListQueryDto,
  ReviewExpenseDto,
} from './dto/expense.dto';
import { validateExpenseAmounts } from './expense-amounts';

const date = (value: string) => new Date(`${value}T00:00:00.000Z`);
const text = (value?: string | null) => value?.trim() || null;
const include = {
  supplier: { select: { id: true, name: true, active: true } },
  category: { select: { id: true, name: true, vatRate: true } },
  createdBy: { select: { id: true, fullName: true } },
  reviewedBy: { select: { id: true, fullName: true } },
} satisfies Prisma.ExpenseInclude;
const view = <T extends { category: { vatRate: Prisma.Decimal } }>(
  item: T,
) => ({
  ...item,
  category: { ...item.category, vatRate: Number(item.category.vatRate) },
});

@Injectable()
export class ExpensesService {
  constructor(private readonly prisma: PrismaService) {}

  async list(companyId: string, query: ExpenseListQueryDto) {
    const where: Prisma.ExpenseWhereInput = {
      companyId,
      archivedAt: null,
      ...(query.status ? { status: query.status } : {}),
      ...(query.categoryId ? { categoryId: query.categoryId } : {}),
      ...(query.supplierId ? { supplierId: query.supplierId } : {}),
      ...(query.currency ? { currency: query.currency } : {}),
      ...(query.search
        ? {
            OR: [
              {
                merchantSnapshot: {
                  contains: query.search.trim(),
                  mode: 'insensitive',
                },
              },
              {
                description: {
                  contains: query.search.trim(),
                  mode: 'insensitive',
                },
              },
            ],
          }
        : {}),
      ...(query.dateFrom || query.dateTo
        ? {
            expenseDate: {
              ...(query.dateFrom ? { gte: date(query.dateFrom) } : {}),
              ...(query.dateTo ? { lte: date(query.dateTo) } : {}),
            },
          }
        : {}),
      ...(query.minAmountMinor !== undefined ||
      query.maxAmountMinor !== undefined
        ? {
            totalMinor: {
              ...(query.minAmountMinor !== undefined
                ? { gte: query.minAmountMinor }
                : {}),
              ...(query.maxAmountMinor !== undefined
                ? { lte: query.maxAmountMinor }
                : {}),
            },
          }
        : {}),
    };
    const items = await this.prisma.expense.findMany({
      where,
      include,
      orderBy: [{ expenseDate: 'desc' }, { createdAt: 'desc' }],
      skip: (query.page - 1) * query.pageSize,
      take: query.pageSize,
    });
    const total = await this.prisma.expense.count({ where });
    const amounts = await this.prisma.expense.aggregate({
      where,
      _sum: { totalMinor: true, vatMinor: true },
    });
    const awaitingReview = await this.prisma.expense.count({
      where: { companyId, archivedAt: null, status: ExpenseStatus.DRAFT },
    });
    return {
      items: items.map(view),
      page: query.page,
      pageSize: query.pageSize,
      total,
      totalPages: Math.max(1, Math.ceil(total / query.pageSize)),
      summary: {
        totalMinor: amounts._sum.totalMinor ?? 0,
        vatMinor: amounts._sum.vatMinor ?? 0,
        awaitingReview,
      },
    };
  }

  async get(companyId: string, id: string) {
    const item = await this.prisma.expense.findFirst({
      where: { id, companyId, archivedAt: null },
      include,
    });
    if (!item) throw new NotFoundException('Expense was not found');
    return view(item);
  }

  async create(companyId: string, userId: string, dto: ExpenseDto) {
    this.validateAmounts(dto);
    await this.validateRelations(companyId, dto);
    const item = await this.prisma.expense.create({
      data: { companyId, createdById: userId, ...this.data(dto) },
      select: { id: true },
    });
    return this.get(companyId, item.id);
  }

  async update(companyId: string, id: string, dto: ExpenseDto) {
    const current = await this.get(companyId, id);
    if (current.status === ExpenseStatus.APPROVED) {
      throw new ConflictException('Approved expenses cannot be edited');
    }
    this.validateAmounts(dto);
    await this.validateRelations(companyId, dto);
    await this.prisma.expense.update({
      where: { id },
      data: { ...this.data(dto), status: ExpenseStatus.DRAFT },
    });
    return this.get(companyId, id);
  }

  async review(
    companyId: string,
    id: string,
    userId: string,
    dto: ReviewExpenseDto,
  ) {
    if (
      dto.status !== ExpenseStatus.APPROVED &&
      dto.status !== ExpenseStatus.REJECTED
    ) {
      throw new BadRequestException(
        'Review status must be APPROVED or REJECTED',
      );
    }
    const current = await this.get(companyId, id);
    if (current.status === ExpenseStatus.APPROVED) {
      throw new ConflictException('Approved expense review is final');
    }
    await this.prisma.expense.update({
      where: { id },
      data: {
        status: dto.status,
        reviewedAt: new Date(),
        reviewedById: userId,
      },
    });
    return this.get(companyId, id);
  }

  async archive(companyId: string, id: string) {
    await this.get(companyId, id);
    await this.prisma.expense.update({
      where: { id },
      data: { archivedAt: new Date() },
    });
    return { archived: true };
  }

  private validateAmounts(dto: ExpenseDto) {
    validateExpenseAmounts(dto.netMinor, dto.vatMinor, dto.totalMinor);
  }

  private async validateRelations(companyId: string, dto: ExpenseDto) {
    const [category, supplier] = await Promise.all([
      this.prisma.expenseCategory.findFirst({
        where: { id: dto.categoryId, companyId, active: true },
        select: { id: true },
      }),
      dto.supplierId
        ? this.prisma.supplier.findFirst({
            where: { id: dto.supplierId, companyId, active: true },
            select: { id: true },
          })
        : Promise.resolve(null),
    ]);
    if (!category)
      throw new BadRequestException('Select an active expense category');
    if (dto.supplierId && !supplier)
      throw new BadRequestException('Select an active supplier');
  }

  private data(dto: ExpenseDto) {
    return {
      supplierId: dto.supplierId || null,
      categoryId: dto.categoryId,
      merchantSnapshot: dto.merchant.trim(),
      description: text(dto.description),
      expenseDate: date(dto.expenseDate),
      currency: dto.currency,
      netMinor: dto.netMinor,
      vatMinor: dto.vatMinor,
      totalMinor: dto.totalMinor,
      paymentMethod: dto.paymentMethod,
      notes: text(dto.notes),
    };
  }
}
