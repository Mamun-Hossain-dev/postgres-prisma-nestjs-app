import { queryOptions } from '@tanstack/react-query';
import { apiFetch } from '@/lib/api';
import type { PaginatedProducts, ProductCollections } from '@/lib/types';

export const productKeys = {
  all: ['products'] as const,
  list: (query: string) => [...productKeys.all, 'list', query] as const,
  homeCollections: () => [...productKeys.all, 'collections', 'home'] as const,
};

export function productListQueryOptions(query: string) {
  return queryOptions({
    queryKey: productKeys.list(query),
    queryFn: () => apiFetch<PaginatedProducts>(`/products?${query}`),
    placeholderData: (previous) => previous,
  });
}

export function homeProductCollectionsQueryOptions() {
  return queryOptions({
    queryKey: productKeys.homeCollections(),
    queryFn: () => apiFetch<ProductCollections>('/products/collections/home'),
    staleTime: 5 * 60_000,
  });
}
