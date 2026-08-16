import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { ExpenseCategoryDto } from './dto/expense.dto';

@Injectable()
export class CategoriesService {
  constructor(private readonly prisma: PrismaService) {}
  async list(companyId: string, includeInactive = false) {
    const categories = await this.prisma.expenseCategory.findMany({
      where: { companyId, ...(includeInactive ? {} : { active: true }) },
      orderBy: { name: 'asc' },
    });
    return categories.map((item) => ({
      ...item,
      vatRate: Number(item.vatRate),
    }));
  }
  async create(companyId: string, dto: ExpenseCategoryDto) {
    try {
      const item = await this.prisma.expenseCategory.create({
        data: { companyId, name: dto.name.trim(), vatRate: dto.vatRate },
      });
      return { ...item, vatRate: Number(item.vatRate) };
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      )
        throw new ConflictException('Category name already exists');
      throw error;
    }
  }
  async update(companyId: string, id: string, dto: ExpenseCategoryDto) {
    const current = await this.prisma.expenseCategory.findFirst({
      where: { id, companyId },
    });
    if (!current) throw new NotFoundException('Expense category was not found');
    const item = await this.prisma.expenseCategory.update({
      where: { id },
      data: { name: dto.name.trim(), vatRate: dto.vatRate },
    });
    return { ...item, vatRate: Number(item.vatRate) };
  }
  async archive(companyId: string, id: string) {
    const current = await this.prisma.expenseCategory.findFirst({
      where: { id, companyId },
    });
    if (!current) throw new NotFoundException('Expense category was not found');
    return this.prisma.expenseCategory.update({
      where: { id },
      data: { active: false },
    });
  }
}
