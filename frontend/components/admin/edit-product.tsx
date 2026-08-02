"use client";

import { useQuery } from "@tanstack/react-query";
import { Boxes } from "lucide-react";
import { useAuth } from "@/components/auth-provider";
import { EmptyState } from "@/components/ui/empty-state";
import { Button } from "@/components/ui/button";
import { apiFetch } from "@/lib/api";
import type { Product } from "@/lib/types";
import { DetailPageSkeleton } from "@/components/ui/skeleton";
import { ProductForm } from "./product-form";

export function EditProduct({ productId }: { productId: string }) {
  const { accessToken } = useAuth();
  const query = useQuery({
    queryKey: ["admin", "product", productId],
    queryFn: () =>
      apiFetch<Product>(`/products/admin/${productId}`, {}, accessToken),
    enabled: Boolean(accessToken),
  });

  if (query.isLoading) {
    return <DetailPageSkeleton />;
  }

  if (query.isError || !query.data) {
    return (
      <EmptyState
        icon={<Boxes />}
        title="Product could not be loaded"
        description={query.error?.message ?? "This product is unavailable."}
        action={<Button onClick={() => void query.refetch()}>Try again</Button>}
      />
    );
  }

  return <ProductForm product={query.data} />;
}
