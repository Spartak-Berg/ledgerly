import { request } from './api';

export interface ExpenseCategory {
  id: string;
  name: string;
  vatRate: number;
  active: boolean;
  systemKey: string | null;
}
export interface Supplier {
  id: string;
  name: string;
  organisationNumber: string | null;
  email: string | null;
  phone: string | null;
  addressLine1: string | null;
  postalCode: string | null;
  city: string | null;
  countryCode: string;
  notes: string | null;
  active: boolean;
  expenseCount: number;
  totalExpenseMinor: number;
}
export interface SupplierInput {
  name: string;
  organisationNumber?: string | null;
  email?: string | null;
  phone?: string | null;
  addressLine1?: string | null;
  postalCode?: string | null;
  city?: string | null;
  countryCode: string;
  notes?: string | null;
}
export type ExpenseStatus = 'DRAFT' | 'APPROVED' | 'REJECTED';
export type ExpensePaymentMethod = 'BANK_TRANSFER' | 'CARD' | 'CASH' | 'OTHER';
export interface Expense {
  id: string;
  supplierId: string | null;
  categoryId: string;
  merchantSnapshot: string;
  description: string | null;
  expenseDate: string;
  currency: string;
  netMinor: number;
  vatMinor: number;
  totalMinor: number;
  paymentMethod: ExpensePaymentMethod;
  status: ExpenseStatus;
  notes: string | null;
  supplier: { id: string; name: string; active: boolean } | null;
  category: ExpenseCategory;
  createdBy: { id: string; fullName: string };
  reviewedBy: { id: string; fullName: string } | null;
}
export interface ExpenseInput {
  supplierId?: string | null;
  categoryId: string;
  merchant: string;
  description?: string | null;
  expenseDate: string;
  currency: string;
  netMinor: number;
  vatMinor: number;
  totalMinor: number;
  paymentMethod: ExpensePaymentMethod;
  notes?: string | null;
}
export interface ExpenseList {
  items: Expense[];
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
  summary: { totalMinor: number; vatMinor: number; awaitingReview: number };
}

export const expensesApi = {
  list: (params = new URLSearchParams()) =>
    request<ExpenseList>(`/expenses?${params}`),
  create: (input: ExpenseInput) =>
    request<Expense>('/expenses', {
      method: 'POST',
      body: JSON.stringify(input),
    }),
  update: (id: string, input: ExpenseInput) =>
    request<Expense>(`/expenses/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(input),
    }),
  review: (id: string, status: 'APPROVED' | 'REJECTED') =>
    request<Expense>(`/expenses/${id}/review`, {
      method: 'POST',
      body: JSON.stringify({ status }),
    }),
  archive: (id: string) =>
    request<{ archived: true }>(`/expenses/${id}`, { method: 'DELETE' }),
};
export const suppliersApi = {
  list: (search = '', active = true) =>
    request<Supplier[]>(
      `/suppliers?search=${encodeURIComponent(search)}&active=${active}`,
    ),
  create: (input: SupplierInput) =>
    request<Supplier>('/suppliers', {
      method: 'POST',
      body: JSON.stringify(input),
    }),
  update: (id: string, input: SupplierInput) =>
    request<Supplier>(`/suppliers/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(input),
    }),
  archive: (id: string) =>
    request<Supplier>(`/suppliers/${id}`, { method: 'DELETE' }),
};
export const categoriesApi = {
  list: (includeInactive = false) =>
    request<ExpenseCategory[]>(
      `/expense-categories?includeInactive=${includeInactive}`,
    ),
  create: (input: { name: string; vatRate: number }) =>
    request<ExpenseCategory>('/expense-categories', {
      method: 'POST',
      body: JSON.stringify(input),
    }),
  update: (id: string, input: { name: string; vatRate: number }) =>
    request<ExpenseCategory>(`/expense-categories/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(input),
    }),
  archive: (id: string) =>
    request<ExpenseCategory>(`/expense-categories/${id}`, { method: 'DELETE' }),
};
