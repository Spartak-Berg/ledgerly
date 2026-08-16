import { ConflictException } from '@nestjs/common';
import { InvoiceStatus } from '@prisma/client';
import {
  assertInvoiceTransition,
  effectiveInvoiceStatus,
} from './invoice-status.policy';

describe('invoice status policy', () => {
  it('allows only explicit lifecycle transitions', () => {
    expect(() =>
      assertInvoiceTransition(InvoiceStatus.DRAFT, InvoiceStatus.ISSUED),
    ).not.toThrow();
    expect(() =>
      assertInvoiceTransition(InvoiceStatus.ISSUED, InvoiceStatus.VOID),
    ).not.toThrow();
    expect(() =>
      assertInvoiceTransition(InvoiceStatus.ISSUED, InvoiceStatus.PAID),
    ).toThrow(ConflictException);
  });

  it('derives overdue without mutating the stored issued or sent state', () => {
    const now = new Date('2026-08-16T12:00:00.000Z');
    expect(
      effectiveInvoiceStatus(
        InvoiceStatus.SENT,
        new Date('2026-08-15T00:00:00.000Z'),
        now,
      ),
    ).toBe(InvoiceStatus.OVERDUE);
    expect(
      effectiveInvoiceStatus(
        InvoiceStatus.SENT,
        new Date('2026-08-16T00:00:00.000Z'),
        now,
      ),
    ).toBe(InvoiceStatus.SENT);
  });
});
