import type { CompanyRole } from '@prisma/client';

export const CompanyPermission = {
  MANAGE_COMPANY: 'MANAGE_COMPANY',
  MANAGE_CUSTOMERS: 'MANAGE_CUSTOMERS',
  VIEW_CUSTOMERS: 'VIEW_CUSTOMERS',
  MANAGE_PRODUCTS: 'MANAGE_PRODUCTS',
  VIEW_PRODUCTS: 'VIEW_PRODUCTS',
  MANAGE_INVOICES: 'MANAGE_INVOICES',
  VIEW_INVOICES: 'VIEW_INVOICES',
  MANAGE_PAYMENTS: 'MANAGE_PAYMENTS',
  VIEW_PAYMENTS: 'VIEW_PAYMENTS',
  MANAGE_EXPENSES: 'MANAGE_EXPENSES',
  VIEW_EXPENSES: 'VIEW_EXPENSES',
  MANAGE_SUPPLIERS: 'MANAGE_SUPPLIERS',
  VIEW_SUPPLIERS: 'VIEW_SUPPLIERS',
} as const;

export type CompanyPermission =
  (typeof CompanyPermission)[keyof typeof CompanyPermission];

const matrix: Record<CompanyRole, ReadonlySet<CompanyPermission>> = {
  OWNER: new Set(Object.values(CompanyPermission)),
  ADMIN: new Set(Object.values(CompanyPermission)),
  ACCOUNTANT: new Set([
    CompanyPermission.VIEW_CUSTOMERS,
    CompanyPermission.VIEW_PRODUCTS,
    CompanyPermission.MANAGE_INVOICES,
    CompanyPermission.VIEW_INVOICES,
    CompanyPermission.MANAGE_PAYMENTS,
    CompanyPermission.VIEW_PAYMENTS,
    CompanyPermission.MANAGE_EXPENSES,
    CompanyPermission.VIEW_EXPENSES,
    CompanyPermission.MANAGE_SUPPLIERS,
    CompanyPermission.VIEW_SUPPLIERS,
  ]),
  EMPLOYEE: new Set(),
};

export const hasPermission = (
  role: CompanyRole,
  permission: CompanyPermission,
) => matrix[role].has(permission);
