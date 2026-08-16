import { ConflictException } from '@nestjs/common';
import { InvoiceStatus } from '@prisma/client';

const transitions: Partial<Record<InvoiceStatus, ReadonlySet<InvoiceStatus>>> =
  {
    DRAFT: new Set([InvoiceStatus.ISSUED]),
    ISSUED: new Set([
      InvoiceStatus.SENT,
      InvoiceStatus.PARTIALLY_PAID,
      InvoiceStatus.PAID,
      InvoiceStatus.VOID,
    ]),
    SENT: new Set([
      InvoiceStatus.PARTIALLY_PAID,
      InvoiceStatus.PAID,
      InvoiceStatus.VOID,
    ]),
    PARTIALLY_PAID: new Set([InvoiceStatus.PAID, InvoiceStatus.VOID]),
    OVERDUE: new Set([
      InvoiceStatus.PARTIALLY_PAID,
      InvoiceStatus.PAID,
      InvoiceStatus.VOID,
    ]),
  };

export const assertInvoiceTransition = (
  current: InvoiceStatus,
  target: InvoiceStatus,
) => {
  if (!transitions[current]?.has(target)) {
    throw new ConflictException(
      `Invoice cannot move from ${current} to ${target}`,
    );
  }
};

export const effectiveInvoiceStatus = (
  status: InvoiceStatus,
  dueDate: Date,
  now = new Date(),
) => {
  if (
    (status === InvoiceStatus.ISSUED || status === InvoiceStatus.SENT) &&
    dueDate.getTime() <
      Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate())
  ) {
    return InvoiceStatus.OVERDUE;
  }
  return status;
};
