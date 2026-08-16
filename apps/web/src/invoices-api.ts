import { request } from './api';

export type InvoiceStatus =
  | 'DRAFT'
  | 'SENT'
  | 'PARTIALLY_PAID'
  | 'PAID'
  | 'OVERDUE'
  | 'VOID';

export interface InvoiceItemInput {
  productId?: string | null;
  description: string;
  quantity: number;
  unit: string;
  unitPriceMinor: number;
  vatRate: number;
}

export interface InvoiceDraftInput {
  customerId: string;
  issueDate: string;
  dueDate: string;
  currency: string;
  reference?: string | null;
  purchaseOrderReference?: string | null;
  notes?: string | null;
  paymentTerms?: string | null;
  items: InvoiceItemInput[];
}

export interface InvoiceItem extends InvoiceItemInput {
  id: string;
  subtotalMinor: number;
  vatMinor: number;
  totalMinor: number;
  position: number;
}

export interface Invoice {
  id: string;
  customerId: string;
  customerNameSnapshot: string;
  companyNameSnapshot: string;
  customerSnapshot: Record<string, unknown>;
  companySnapshot: Record<string, unknown>;
  status: InvoiceStatus;
  number: string | null;
  issueDate: string;
  dueDate: string;
  currency: string;
  reference: string | null;
  purchaseOrderReference: string | null;
  notes: string | null;
  paymentTerms: string | null;
  subtotalMinor: number;
  vatMinor: number;
  totalMinor: number;
  version: number;
  items?: InvoiceItem[];
}

export const invoicesApi = {
  list(params = new URLSearchParams()) {
    const query = params.toString();
    return request<Invoice[]>(`/invoices${query ? `?${query}` : ''}`);
  },
  get(id: string) {
    return request<Invoice>(`/invoices/${id}`);
  },
  create(input: InvoiceDraftInput) {
    return request<Invoice>('/invoices', {
      method: 'POST',
      body: JSON.stringify(input),
    });
  },
  update(id: string, input: InvoiceDraftInput & { version: number }) {
    return request<Invoice>(`/invoices/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(input),
    });
  },
  duplicate(id: string) {
    return request<Invoice>(`/invoices/${id}/duplicate`, { method: 'POST' });
  },
  archive(id: string) {
    return request<{ archived: true }>(`/invoices/${id}`, { method: 'DELETE' });
  },
};
