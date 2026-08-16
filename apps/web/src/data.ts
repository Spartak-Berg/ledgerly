import type { Expense, Invoice } from './lib'

export const invoices: Invoice[] = [
  { id: '1', number: 'INV-2026-0142', customer: 'Nordlys Studio AS', issueDate: '2026-07-14', dueDate: '2026-08-13', status: 'Sent', amount: 48250 },
  { id: '2', number: 'INV-2026-0141', customer: 'Fjord & Form AS', issueDate: '2026-07-10', dueDate: '2026-07-24', status: 'Paid', amount: 76500 },
  { id: '3', number: 'INV-2026-0140', customer: 'Bergen Bryggeri', issueDate: '2026-07-06', dueDate: '2026-07-20', status: 'Overdue', amount: 18750 },
  { id: '4', number: 'INV-2026-0139', customer: 'Arktisk Arkitektur', issueDate: '2026-07-02', dueDate: '2026-08-01', status: 'Sent', amount: 95400 },
  { id: '5', number: 'INV-2026-0138', customer: 'Løkka Kaffe AS', issueDate: '2026-06-28', dueDate: '2026-07-12', status: 'Draft', amount: 7900 },
]

export const expenses: Expense[] = [
  { id: '1', merchant: 'Adobe', category: 'Software', date: '2026-07-18', amount: 749, vat: 150, status: 'Approved', color: '#fa5252' },
  { id: '2', merchant: 'Norwegian', category: 'Travel', date: '2026-07-16', amount: 3489, vat: 0, status: 'Approved', color: '#e03131' },
  { id: '3', merchant: 'IKEA Forus', category: 'Office', date: '2026-07-13', amount: 6240, vat: 1248, status: 'Pending', color: '#4263eb' },
  { id: '4', merchant: 'Sabi Omakase', category: 'Meals', date: '2026-07-11', amount: 1890, vat: 212, status: 'Pending', color: '#212529' },
  { id: '5', merchant: 'Meta Platforms', category: 'Marketing', date: '2026-07-08', amount: 4500, vat: 900, status: 'Approved', color: '#1971c2' },
]

export const cashFlow = [
  { month: 'Feb', income: 186, expenses: 92 }, { month: 'Mar', income: 221, expenses: 108 },
  { month: 'Apr', income: 198, expenses: 96 }, { month: 'May', income: 268, expenses: 121 },
  { month: 'Jun', income: 246, expenses: 117 }, { month: 'Jul', income: 312, expenses: 134 },
]
