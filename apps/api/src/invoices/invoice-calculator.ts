import { BadRequestException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import type { InvoiceItemDto } from './dto/invoice-draft.dto';

export interface CalculatedInvoiceItem extends InvoiceItemDto {
  subtotalMinor: number;
  vatMinor: number;
  totalMinor: number;
  position: number;
}

const checkedMinorAmount = (amount: Prisma.Decimal, label: string) => {
  const value = amount
    .toDecimalPlaces(0, Prisma.Decimal.ROUND_HALF_UP)
    .toNumber();
  if (!Number.isSafeInteger(value) || value < 0 || value > 2147483647) {
    throw new BadRequestException(`${label} exceeds the supported amount`);
  }
  return value;
};

export const calculateInvoice = (items: InvoiceItemDto[]) => {
  const calculatedItems: CalculatedInvoiceItem[] = items.map(
    (item, position) => {
      const subtotalMinor = checkedMinorAmount(
        new Prisma.Decimal(item.quantity).mul(item.unitPriceMinor),
        'Line subtotal',
      );
      const vatMinor = checkedMinorAmount(
        new Prisma.Decimal(subtotalMinor).mul(item.vatRate).div(100),
        'Line VAT',
      );
      const totalMinor = checkedMinorAmount(
        new Prisma.Decimal(subtotalMinor).add(vatMinor),
        'Line total',
      );
      return { ...item, subtotalMinor, vatMinor, totalMinor, position };
    },
  );

  const subtotalMinor = calculatedItems.reduce(
    (sum, item) => sum + item.subtotalMinor,
    0,
  );
  const vatMinor = calculatedItems.reduce(
    (sum, item) => sum + item.vatMinor,
    0,
  );
  const totalMinor = subtotalMinor + vatMinor;
  for (const [value, label] of [
    [subtotalMinor, 'Invoice subtotal'],
    [vatMinor, 'Invoice VAT'],
    [totalMinor, 'Invoice total'],
  ] as const) {
    if (!Number.isSafeInteger(value) || value > 2147483647) {
      throw new BadRequestException(`${label} exceeds the supported amount`);
    }
  }
  return { items: calculatedItems, subtotalMinor, vatMinor, totalMinor };
};
