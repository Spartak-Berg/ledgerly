import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { ApiError, request } from './api';
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
      .then((result) => active && setProfile(result))
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
    setProfile(await request<AuthProfile>('/auth/login', { method: 'POST', body: JSON.stringify(input) }));
  }, []);
  const register = useCallback(async (input: RegisterInput) => {
    setProfile(await request<AuthProfile>('/auth/register', { method: 'POST', body: JSON.stringify(input) }));
  }, []);
  const logout = useCallback(async () => {
    try {
      await request<void>('/auth/logout', { method: 'POST' });
    } finally {
      setProfile(null);
    }
  }, []);

  const value = useMemo(
    () => ({ loading, login, logout, profile, register }),
    [loading, login, logout, profile, register],
  );
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
