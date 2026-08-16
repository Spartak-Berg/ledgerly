import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { ApiError, request, setApiCompanyId } from './api';
import { companyApi } from './company-api';
import {
  AuthContext,
  type AuthProfile,
  type LoginInput,
  type RegisterInput,
} from './auth-context';

export function AuthProvider({ children }: { children: ReactNode }) {
  const [profile, setProfile] = useState<AuthProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    request<AuthProfile>('/auth/me')
      .then((result) => {
        if (active) {
          setApiCompanyId(result.company.id);
          setProfile(result);
        }
      })
      .catch((error: unknown) => {
        if (active && (!(error instanceof ApiError) || error.status !== 401)) {
          console.error('Could not restore the Ledgerly session', error);
        }
      })
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, []);

  const login = useCallback(async (input: LoginInput) => {
    const result = await request<AuthProfile>('/auth/login', { method: 'POST', body: JSON.stringify(input) });
    setApiCompanyId(result.company.id);
    setProfile(result);
  }, []);
  const register = useCallback(async (input: RegisterInput) => {
    const result = await request<AuthProfile>('/auth/register', { method: 'POST', body: JSON.stringify(input) });
    setApiCompanyId(result.company.id);
    setProfile(result);
  }, []);
  const logout = useCallback(async () => {
    try {
      await request<void>('/auth/logout', { method: 'POST' });
    } finally {
      setApiCompanyId();
      setProfile(null);
    }
  }, []);

  const refreshProfile = useCallback(async () => {
    const result = await request<AuthProfile>('/auth/me');
    setApiCompanyId(result.company.id);
    setProfile(result);
  }, []);

  const switchCompany = useCallback(async (companyId: string) => {
    const result = await companyApi.select(companyId);
    setApiCompanyId(result.company.id);
    setProfile(result);
  }, []);

  const value = useMemo(
    () => ({ loading, login, logout, profile, refreshProfile, register, switchCompany }),
    [loading, login, logout, profile, refreshProfile, register, switchCompany],
  );
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
