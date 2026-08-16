import { SetMetadata } from '@nestjs/common';
import {
  IS_PUBLIC_KEY,
  PERMISSION_KEY,
  SKIP_COMPANY_KEY,
  SKIP_CSRF_KEY,
} from './auth.constants';
import type { CompanyPermission } from './permissions';

export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);
export const SkipCsrf = () => SetMetadata(SKIP_CSRF_KEY, true);
export const SkipCompanyContext = () => SetMetadata(SKIP_COMPANY_KEY, true);
export const RequirePermission = (permission: CompanyPermission) =>
  SetMetadata(PERMISSION_KEY, permission);
