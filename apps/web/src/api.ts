import type { Customer, CustomerStatus } from './lib';

const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3000/api/v1';

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

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${API_URL}${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
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
    throw new Error(message ?? `Request failed with status ${response.status}`);
  }

  if (response.status === 204) return undefined as T;
  return response.json() as Promise<T>;
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
