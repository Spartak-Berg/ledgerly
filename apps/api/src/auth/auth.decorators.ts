import { SetMetadata } from '@nestjs/common';
import { IS_PUBLIC_KEY, SKIP_CSRF_KEY } from './auth.constants';

export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);
export const SkipCsrf = () => SetMetadata(SKIP_CSRF_KEY, true);
