import { InvoiceStatus } from '@prisma/client';

export const paymentBalance = (
  totalMinor: number,
  amountPaidMinor: number,
  wasSent: boolean,
) => {
  const remainingMinor = totalMinor - amountPaidMinor;
  const status =
    remainingMinor === 0
      ? InvoiceStatus.PAID
      : amountPaidMinor > 0
        ? InvoiceStatus.PARTIALLY_PAID
        : wasSent
          ? InvoiceStatus.SENT
          : InvoiceStatus.ISSUED;
  return { amountPaidMinor, remainingMinor, status };
};
