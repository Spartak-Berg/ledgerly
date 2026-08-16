import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { ProductDto } from './dto/product.dto';

const view = (
  item: { defaultQuantity: Prisma.Decimal; vatRate: Prisma.Decimal } & Record<
    string,
    unknown
  >,
) => ({
  ...item,
  defaultQuantity: Number(item.defaultQuantity),
  vatRate: Number(item.vatRate),
});

@Injectable()
export class ProductsService {
  constructor(private readonly prisma: PrismaService) {}
  async list(companyId: string, search = '', type?: 'PRODUCT' | 'SERVICE') {
    const items = await this.prisma.product.findMany({
      where: {
        companyId,
        ...(type ? { type } : {}),
        ...(search
          ? {
              OR: [
                { name: { contains: search, mode: 'insensitive' } },
                { sku: { contains: search, mode: 'insensitive' } },
              ],
            }
          : {}),
      },
      orderBy: { name: 'asc' },
    });
    return items.map(view);
  }
  async get(companyId: string, id: string) {
    const item = await this.prisma.product.findFirst({
      where: { companyId, id },
    });
    if (!item) throw new NotFoundException('Product was not found');
    return view(item);
  }
  async create(companyId: string, dto: ProductDto) {
    try {
      return view(
        await this.prisma.product.create({
          data: { ...dto, companyId, sku: dto.sku?.trim() || null },
        }),
      );
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      )
        throw new ConflictException('SKU already exists in this company');
      throw error;
    }
  }
  async update(companyId: string, id: string, dto: ProductDto) {
    await this.get(companyId, id);
    return view(
      await this.prisma.product.update({
        where: { companyId, id },
        data: { ...dto, sku: dto.sku?.trim() || null },
      }),
    );
  }
  async duplicate(companyId: string, id: string) {
    const source = await this.prisma.product.findFirst({
      where: { companyId, id },
    });
    if (!source) throw new NotFoundException('Product was not found');
    return view(
      await this.prisma.product.create({
        data: {
          companyId,
          name: `${source.name} copy`,
          description: source.description,
          type: source.type,
          unit: source.unit,
          defaultQuantity: source.defaultQuantity,
          unitPriceMinor: source.unitPriceMinor,
          vatRate: source.vatRate,
          currency: source.currency,
          category: source.category,
          active: source.active,
          sku: null,
        },
      }),
    );
  }
  async archive(companyId: string, id: string) {
    await this.get(companyId, id);
    return view(
      await this.prisma.product.update({
        where: { companyId, id },
        data: { active: false, archivedAt: new Date() },
      }),
    );
  }
}
