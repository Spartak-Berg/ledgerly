export const money = (value: number, currency = 'NOK') =>
  new Intl.NumberFormat('nb-NO', { style: 'currency', currency, maximumFractionDigits: 0 }).format(value)

export const shortDate = (value: string) =>
  new Intl.DateTimeFormat('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }).format(new Date(value))

export type InvoiceStatus = 'Draft' | 'Sent' | 'Paid' | 'Overdue'
export type CustomerStatus = 'Active' | 'Lead' | 'Archived'
export type ExpenseStatus = 'Approved' | 'Pending' | 'Rejected'

export interface Customer { id: string; company: string; contact: string; email: string; phone: string; outstanding: number; status: CustomerStatus }
export interface Invoice { id: string; number: string; customer: string; issueDate: string; dueDate: string; status: InvoiceStatus; amount: number }
export interface Expense { id: string; merchant: string; category: string; date: string; amount: number; vat: number; status: ExpenseStatus; color: string }

export interface LineItem { id: string; description: string; quantity: number; unitPrice: number; vatRate: number }
export const invoiceTotals = (items: LineItem[]) => {
  const subtotal = items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0)
  const vat = items.reduce((sum, item) => sum + item.quantity * item.unitPrice * item.vatRate / 100, 0)
  return { subtotal, vat, total: subtotal + vat }
}
