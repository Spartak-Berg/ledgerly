import { download, request } from './api';

export type InvoiceStatus =
  'DRAFT' | 'ISSUED' | 'SENT' | 'PARTIALLY_PAID' | 'PAID' | 'OVERDUE' | 'VOID';

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
  createdAt: string;
  updatedAt: string;
  issuedAt: string | null;
  sentAt: string | null;
  voidedAt: string | null;
  voidReason: string | null;
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
  issue(id: string, version: number) {
    return request<Invoice>(`/invoices/${id}/issue`, {
      method: 'POST',
      body: JSON.stringify({ version }),
    });
  },
  markSent(id: string) {
    return request<Invoice>(`/invoices/${id}/mark-sent`, { method: 'POST' });
  },
  void(id: string, reason: string) {
    return request<Invoice>(`/invoices/${id}/void`, {
      method: 'POST',
      body: JSON.stringify({ reason }),
    });
  },
  downloadPdf(id: string) {
    return download(`/invoices/${id}/pdf`);
  },
};
