import type { CompanyRole } from '@prisma/client';

export const CompanyPermission = {
  MANAGE_COMPANY: 'MANAGE_COMPANY',
  MANAGE_CUSTOMERS: 'MANAGE_CUSTOMERS',
  VIEW_CUSTOMERS: 'VIEW_CUSTOMERS',
} as const;

export type CompanyPermission =
  (typeof CompanyPermission)[keyof typeof CompanyPermission];

const matrix: Record<CompanyRole, ReadonlySet<CompanyPermission>> = {
  OWNER: new Set(Object.values(CompanyPermission)),
  ADMIN: new Set(Object.values(CompanyPermission)),
  ACCOUNTANT: new Set([CompanyPermission.VIEW_CUSTOMERS]),
  EMPLOYEE: new Set(),
};

export const hasPermission = (
  role: CompanyRole,
  permission: CompanyPermission,
) => matrix[role].has(permission);
