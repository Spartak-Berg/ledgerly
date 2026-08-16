import { BadRequestException } from '@nestjs/common';
import { calculateInvoice } from './invoice-calculator';

describe('calculateInvoice', () => {
  it('rounds VAT per line and sums mixed VAT rates', () => {
    expect(
      calculateInvoice([
        {
          description: 'Consulting',
          quantity: 2.5,
          unit: 'hour',
          unitPriceMinor: 12345,
          vatRate: 25,
        },
        {
          description: 'Exempt item',
          quantity: 3,
          unit: 'item',
          unitPriceMinor: 999,
          vatRate: 0,
        },
      ]),
    ).toMatchObject({
      subtotalMinor: 33860,
      vatMinor: 7716,
      totalMinor: 41576,
      items: [
        { subtotalMinor: 30863, vatMinor: 7716, totalMinor: 38579 },
        { subtotalMinor: 2997, vatMinor: 0, totalMinor: 2997 },
      ],
    });
  });

  it('uses decimal arithmetic for fractional quantities', () => {
    const result = calculateInvoice([
      {
        description: 'Measured work',
        quantity: 0.1,
        unit: 'hour',
        unitPriceMinor: 1005,
        vatRate: 25,
      },
    ]);
    expect(result.items[0]).toMatchObject({
      subtotalMinor: 101,
      vatMinor: 25,
      totalMinor: 126,
    });
  });

  it('rejects totals outside the database integer range', () => {
    expect(() =>
      calculateInvoice([
        {
          description: 'Too large',
          quantity: 2,
          unit: 'item',
          unitPriceMinor: 2147483647,
          vatRate: 25,
        },
      ]),
    ).toThrow(BadRequestException);
  });
});
