import { CompanyPermission, hasPermission } from './permissions';

describe('company permission matrix', () => {
  it('allows owners and admins to manage company data', () => {
    expect(hasPermission('OWNER', CompanyPermission.MANAGE_COMPANY)).toBe(true);
    expect(hasPermission('ADMIN', CompanyPermission.MANAGE_CUSTOMERS)).toBe(
      true,
    );
  });

  it('allows accountants to work with invoices and payments but not customer records', () => {
    expect(hasPermission('ACCOUNTANT', CompanyPermission.VIEW_CUSTOMERS)).toBe(
      true,
    );
    expect(
      hasPermission('ACCOUNTANT', CompanyPermission.MANAGE_CUSTOMERS),
    ).toBe(false);
    expect(hasPermission('ACCOUNTANT', CompanyPermission.MANAGE_INVOICES)).toBe(
      true,
    );
    expect(hasPermission('ACCOUNTANT', CompanyPermission.MANAGE_PAYMENTS)).toBe(
      true,
    );
  });

  it('does not grant employees customer or company management', () => {
    expect(hasPermission('EMPLOYEE', CompanyPermission.VIEW_CUSTOMERS)).toBe(
      false,
    );
    expect(hasPermission('EMPLOYEE', CompanyPermission.MANAGE_COMPANY)).toBe(
      false,
    );
  });
});
