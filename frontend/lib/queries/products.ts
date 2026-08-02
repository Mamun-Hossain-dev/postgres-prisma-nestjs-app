import { queryOptions } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api";
import type {
  PaginatedProducts,
  Product,
  ProductCollections,
} from "@/lib/types";

const CATALOG_STALE_TIME = 10 * 60_000;
const CATALOG_GC_TIME = 30 * 60_000;

const catalogCache = {
  staleTime: CATALOG_STALE_TIME,
  gcTime: CATALOG_GC_TIME,
  refetchOnWindowFocus: false,
} as const;

export const productKeys = {
  all: ["products"] as const,
  list: (query: string) => [...productKeys.all, "list", query] as const,
  detail: (id: string) => [...productKeys.all, "detail", id] as const,
  related: (category: string, id: string) =>
    [...productKeys.all, "related", category, id] as const,
  homeCollections: () => [...productKeys.all, "collections", "home"] as const,
};

export function productListQueryOptions(query: string) {
  return queryOptions({
    queryKey: productKeys.list(query),
    queryFn: () => apiFetch<PaginatedProducts>(`/products?${query}`),
    placeholderData: (previous) => previous,
    ...catalogCache,
  });
}

export function productDetailQueryOptions(productId: string) {
  return queryOptions({
    queryKey: productKeys.detail(productId),
    queryFn: () => apiFetch<Product>(`/products/${productId}`),
    ...catalogCache,
  });
}

export function relatedProductsQueryOptions(
  category: string | undefined,
  productId: string,
) {
  return queryOptions({
    queryKey: productKeys.related(category ?? "pending", productId),
    queryFn: () =>
      apiFetch<PaginatedProducts>(
        `/products?category=${category}&page=1&limit=5&sort=newest`,
      ),
    enabled: Boolean(category),
    ...catalogCache,
  });
}

export function homeProductCollectionsQueryOptions() {
  return queryOptions({
    queryKey: productKeys.homeCollections(),
    queryFn: () => apiFetch<ProductCollections>("/products/collections/home"),
    ...catalogCache,
  });
}
