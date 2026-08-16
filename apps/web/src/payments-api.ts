import { request } from './api';
import type { InvoiceStatus } from './invoices-api';

export type PaymentMethod = 'BANK_TRANSFER' | 'CARD' | 'CASH' | 'OTHER';

export interface Payment {
  id: string;
  invoiceId: string;
  amountMinor: number;
  paymentDate: string;
  method: PaymentMethod;
  reference: string | null;
  note: string | null;
  createdAt: string;
  recordedBy: { id: string; fullName: string };
  reversedAt: string | null;
  reversedBy: { id: string; fullName: string } | null;
  reversalReason: string | null;
}

export interface PaymentBalance {
  amountPaidMinor: number;
  remainingMinor: number;
  status: InvoiceStatus;
}

export interface PaymentResult {
  payment: Payment;
  balance: PaymentBalance;
}

export const paymentsApi = {
  list(invoiceId: string) {
    return request<Payment[]>(`/invoices/${invoiceId}/payments`);
  },
  record(
    invoiceId: string,
    input: {
      amountMinor: number;
      paymentDate: string;
      method: PaymentMethod;
      reference?: string | null;
      note?: string | null;
    },
  ) {
    return request<PaymentResult>(`/invoices/${invoiceId}/payments`, {
      method: 'POST',
      body: JSON.stringify(input),
    });
  },
  reverse(invoiceId: string, paymentId: string, reason: string) {
    return request<PaymentResult>(
      `/invoices/${invoiceId}/payments/${paymentId}/reverse`,
      { method: 'POST', body: JSON.stringify({ reason }) },
    );
  },
};
