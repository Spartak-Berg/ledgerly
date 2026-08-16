export const DEFAULT_EXPENSE_CATEGORIES = [
  { name: 'Office supplies', systemKey: 'OFFICE', vatRate: 25 },
  { name: 'Software', systemKey: 'SOFTWARE', vatRate: 25 },
  { name: 'Travel', systemKey: 'TRAVEL', vatRate: 12 },
  { name: 'Professional services', systemKey: 'PROFESSIONAL', vatRate: 25 },
  { name: 'Other', systemKey: 'OTHER', vatRate: 25 },
] as const;
