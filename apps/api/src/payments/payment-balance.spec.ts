import { InvoiceStatus } from '@prisma/client';
import { paymentBalance } from './payment-balance';

describe('paymentBalance', () => {
  it('derives the 4,000 plus 6,000 partial payment scenario', () => {
    expect(paymentBalance(1_000_000, 400_000, true)).toEqual({
      amountPaidMinor: 400_000,
      remainingMinor: 600_000,
      status: InvoiceStatus.PARTIALLY_PAID,
    });
    expect(paymentBalance(1_000_000, 1_000_000, true)).toEqual({
      amountPaidMinor: 1_000_000,
      remainingMinor: 0,
      status: InvoiceStatus.PAID,
    });
  });

  it('restores sent or issued when every payment is reversed', () => {
    expect(paymentBalance(10_000, 0, true).status).toBe(InvoiceStatus.SENT);
    expect(paymentBalance(10_000, 0, false).status).toBe(InvoiceStatus.ISSUED);
  });
});
