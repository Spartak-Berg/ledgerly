import { request } from './api';
export interface Product { id: string; name: string; description: string | null; sku: string | null; type: 'PRODUCT'|'SERVICE'; unit: string; defaultQuantity: number; unitPriceMinor: number; vatRate: number; currency: string; category: string | null; active: boolean }
export type ProductInput = Omit<Product, 'id'>;
export const productsApi = {
  list: (search = '', type = '') => request<Product[]>(`/products?search=${encodeURIComponent(search)}${type ? `&type=${type}` : ''}`),
  create: (input: ProductInput) => request<Product>('/products', { method: 'POST', body: JSON.stringify(input) }),
  update: (id: string, input: ProductInput) => request<Product>(`/products/${id}`, { method: 'PATCH', body: JSON.stringify(input) }),
  duplicate: (id: string) => request<Product>(`/products/${id}/duplicate`, { method: 'POST' }),
  archive: (id: string) => request<Product>(`/products/${id}`, { method: 'DELETE' }),
};
