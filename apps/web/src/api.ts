import type { Customer, CustomerStatus, CustomerType } from './lib';

const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3000/api/v1';
const CSRF_COOKIE = 'ledgerly_csrf';
let currentCompanyId: string | undefined;

export const setApiCompanyId = (companyId?: string) => {
  currentCompanyId = companyId;
};

type ApiCustomerStatus = 'ACTIVE' | 'LEAD' | 'ARCHIVED';
type ApiCustomerType = 'COMPANY' | 'INDIVIDUAL';

interface ApiCustomer {
  id: string;
  companyName: string;
  type: ApiCustomerType;
  organisationNumber: string | null;
  contactName: string | null;
  email: string | null;
  phone: string | null;
  billingAddressLine1: string | null; billingAddressLine2: string | null; billingPostalCode: string | null; billingCity: string | null;
  postalAddressLine1: string | null; postalAddressLine2: string | null; postalPostalCode: string | null; postalCity: string | null;
  countryCode: string; vatNumber: string | null; defaultCurrency: string; defaultPaymentDays: number; notes: string | null;
  status: ApiCustomerStatus;
  createdAt: string;
  updatedAt: string;
}

export interface CustomerInput {
  companyName: string;
  type: ApiCustomerType;
  organisationNumber?: string;
  contactName?: string;
  email?: string;
  phone?: string;
  billingAddressLine1?: string; billingAddressLine2?: string; billingPostalCode?: string; billingCity?: string;
  postalAddressLine1?: string; postalAddressLine2?: string; postalPostalCode?: string; postalCity?: string;
  countryCode: string; vatNumber?: string; defaultCurrency: string; defaultPaymentDays: number; notes?: string;
  status: ApiCustomerStatus;
}

const toCustomer = (customer: ApiCustomer): Customer => ({
  id: customer.id,
  company: customer.companyName,
  type: `${customer.type[0]}${customer.type.slice(1).toLowerCase()}` as CustomerType,
  organisationNumber: customer.organisationNumber ?? '',
  contact: customer.contactName ?? '',
  email: customer.email ?? '',
  phone: customer.phone ?? '',
  billingAddressLine1: customer.billingAddressLine1 ?? '', billingAddressLine2: customer.billingAddressLine2 ?? '', billingPostalCode: customer.billingPostalCode ?? '', billingCity: customer.billingCity ?? '',
  postalAddressLine1: customer.postalAddressLine1 ?? '', postalAddressLine2: customer.postalAddressLine2 ?? '', postalPostalCode: customer.postalPostalCode ?? '', postalCity: customer.postalCity ?? '',
  countryCode: customer.countryCode, vatNumber: customer.vatNumber ?? '', defaultCurrency: customer.defaultCurrency, defaultPaymentDays: customer.defaultPaymentDays, notes: customer.notes ?? '',
  outstanding: 0,
  status: `${customer.status[0]}${customer.status.slice(1).toLowerCase()}` as CustomerStatus,
});

const cleanInput = (input: CustomerInput) => ({
  companyName: input.companyName.trim(),
  status: input.status,
  type: input.type,
  contactName: input.contactName?.trim() || null,
  email: input.email?.trim() || null,
  phone: input.phone?.trim() || null,
  organisationNumber: input.organisationNumber?.trim() || null,
  billingAddressLine1: input.billingAddressLine1?.trim() || null, billingAddressLine2: input.billingAddressLine2?.trim() || null, billingPostalCode: input.billingPostalCode?.trim() || null, billingCity: input.billingCity?.trim() || null,
  postalAddressLine1: input.postalAddressLine1?.trim() || null, postalAddressLine2: input.postalAddressLine2?.trim() || null, postalPostalCode: input.postalPostalCode?.trim() || null, postalCity: input.postalCity?.trim() || null,
  countryCode: input.countryCode, vatNumber: input.vatNumber?.trim() || null, defaultCurrency: input.defaultCurrency, defaultPaymentDays: input.defaultPaymentDays, notes: input.notes?.trim() || null,
});

export class ApiError extends Error {
  readonly status: number;

  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

const csrfToken = () =>
  document.cookie
    .split('; ')
    .find((value) => value.startsWith(`${CSRF_COOKIE}=`))
    ?.slice(CSRF_COOKIE.length + 1);

async function rawRequest<T>(path: string, init?: RequestInit): Promise<T> {
  const token = csrfToken();
  const response = await fetch(`${API_URL}${path}`, {
    ...init,
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { 'x-csrf-token': token } : {}),
      ...(currentCompanyId ? { 'x-company-id': currentCompanyId } : {}),
      ...init?.headers,
    },
  });

  if (!response.ok) {
    const body = (await response.json().catch(() => null)) as {
      message?: string | string[];
    } | null;
    const message = Array.isArray(body?.message)
      ? body.message.join(', ')
      : body?.message;
    throw new ApiError(message ?? `Request failed with status ${response.status}`, response.status);
  }

  if (response.status === 204) return undefined as T;
  return response.json() as Promise<T>;
}

let refreshRequest: Promise<unknown> | undefined;

export async function request<T>(path: string, init?: RequestInit): Promise<T> {
  try {
    return await rawRequest<T>(path, init);
  } catch (error) {
    const cannotRefresh = ['/auth/login', '/auth/refresh', '/auth/register'].includes(path);
    if (
      !(error instanceof ApiError) ||
      error.status !== 401 ||
      cannotRefresh ||
      !csrfToken()
    ) {
      throw error;
    }

    refreshRequest ??= rawRequest('/auth/refresh', { method: 'POST' }).finally(() => {
      refreshRequest = undefined;
    });
    await refreshRequest;
    return rawRequest<T>(path, init);
  }
}

export const customerApi = {
  async list(): Promise<Customer[]> {
    const result = await request<{ items: ApiCustomer[] }>('/customers');
    return result.items.map(toCustomer);
  },

  async search(params: URLSearchParams) {
    const result = await request<{ items: ApiCustomer[]; page: number; pageSize: number; total: number; totalPages: number }>(`/customers?${params}`);
    return { ...result, items: result.items.map(toCustomer) };
  },

  async get(id: string): Promise<Customer> {
    return toCustomer(await request<ApiCustomer>(`/customers/${id}`));
  },

  async create(input: CustomerInput): Promise<Customer> {
    return toCustomer(
      await request<ApiCustomer>('/customers', {
        method: 'POST',
        body: JSON.stringify(cleanInput(input)),
      }),
    );
  },

  async update(id: string, input: CustomerInput): Promise<Customer> {
    return toCustomer(
      await request<ApiCustomer>(`/customers/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(cleanInput(input)),
      }),
    );
  },

  remove(id: string): Promise<void> {
    return request<void>(`/customers/${id}`, { method: 'DELETE' });
  },
};
