import { BadRequestException } from '@nestjs/common';
import { validateExpenseAmounts } from './expense-amounts';

describe('validateExpenseAmounts', () => {
  it('preserves exact minor-unit net, VAT and total values', () => {
    expect(validateExpenseAmounts(8_000, 2_000, 10_000)).toEqual({
      netMinor: 8_000,
      vatMinor: 2_000,
      totalMinor: 10_000,
    });
  });
  it('rejects an inconsistent total', () => {
    expect(() => validateExpenseAmounts(8_000, 2_000, 9_999)).toThrow(
      BadRequestException,
    );
  });
});
