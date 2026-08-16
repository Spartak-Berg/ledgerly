import type { Customer, CustomerStatus } from './lib';

const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3000/api/v1';
const CSRF_COOKIE = 'ledgerly_csrf';
let currentCompanyId: string | undefined;

export const setApiCompanyId = (companyId?: string) => {
  currentCompanyId = companyId;
};

type ApiCustomerStatus = 'ACTIVE' | 'LEAD' | 'ARCHIVED';

interface ApiCustomer {
  id: string;
  companyName: string;
  contactName: string | null;
  email: string | null;
  phone: string | null;
  status: ApiCustomerStatus;
  createdAt: string;
  updatedAt: string;
}

export interface CustomerInput {
  companyName: string;
  contactName?: string;
  email?: string;
  phone?: string;
  status: ApiCustomerStatus;
}

const toCustomer = (customer: ApiCustomer): Customer => ({
  id: customer.id,
  company: customer.companyName,
  contact: customer.contactName ?? '',
  email: customer.email ?? '',
  phone: customer.phone ?? '',
  outstanding: 0,
  status: `${customer.status[0]}${customer.status.slice(1).toLowerCase()}` as CustomerStatus,
});

const cleanInput = (input: CustomerInput) => ({
  companyName: input.companyName.trim(),
  status: input.status,
  contactName: input.contactName?.trim() || null,
  email: input.email?.trim() || null,
  phone: input.phone?.trim() || null,
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
    const customers = await request<ApiCustomer[]>('/customers');
    return customers.map(toCustomer);
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
