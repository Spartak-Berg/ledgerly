import { BadRequestException } from '@nestjs/common';

export const validateExpenseAmounts = (
  netMinor: number,
  vatMinor: number,
  totalMinor: number,
) => {
  if (netMinor + vatMinor !== totalMinor) {
    throw new BadRequestException('Net plus VAT must equal the total amount');
  }
  return { netMinor, vatMinor, totalMinor };
};
