import { request } from './api';
import type { AuthProfile } from './auth-context';

export type CompanyRole = 'OWNER' | 'ADMIN' | 'ACCOUNTANT' | 'EMPLOYEE';

export interface CompanySummary {
  id: string;
  name: string;
  defaultCurrency: string;
  role: CompanyRole;
}

export interface CompanyDetail extends CompanySummary {
  organisationNumber: string | null;
  email: string | null;
  phone: string | null;
  website: string | null;
  addressLine1: string | null;
  addressLine2: string | null;
  postalCode: string | null;
  city: string | null;
  countryCode: string;
  vatRegistered: boolean;
  vatNumber: string | null;
  bankAccount: string | null;
  iban: string | null;
  bic: string | null;
  settings: {
    defaultPaymentDays: number;
    defaultVatRate: number;
    financialYearStartMonth: number;
    invoicePrefix: string;
    invoiceNumberPadding: number;
    nextInvoiceNumber: number;
  };
}

export type UpdateCompanyInput = Omit<
  CompanyDetail,
  'id' | 'role' | 'settings'
> &
  Omit<CompanyDetail['settings'], 'nextInvoiceNumber'>;

export const companyApi = {
  list: () => request<CompanySummary[]>('/companies'),
  get: (id: string) => request<CompanyDetail>(`/companies/${id}`),
  select: (companyId: string) =>
    request<AuthProfile>('/companies/current', {
      method: 'PUT',
      body: JSON.stringify({ companyId }),
    }),
  update: (id: string, input: UpdateCompanyInput) =>
    request<CompanyDetail>(`/companies/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(input),
    }),
};
