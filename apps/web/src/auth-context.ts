import { createContext } from 'react';

export interface AuthProfile {
  user: { id: string; email: string; fullName: string };
  company: {
    id: string;
    name: string;
    defaultCurrency: string;
    role: 'OWNER' | 'ADMIN' | 'ACCOUNTANT' | 'EMPLOYEE';
  };
}

export interface LoginInput {
  email: string;
  password: string;
}

export interface RegisterInput extends LoginInput {
  fullName: string;
  companyName: string;
}

export interface AuthValue {
  loading: boolean;
  profile: AuthProfile | null;
  login(input: LoginInput): Promise<void>;
  logout(): Promise<void>;
  register(input: RegisterInput): Promise<void>;
}

export const AuthContext = createContext<AuthValue | null>(null);
