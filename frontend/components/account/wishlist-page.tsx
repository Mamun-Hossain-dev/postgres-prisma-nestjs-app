"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Heart, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { AccountShell } from "@/components/account-shell";
import { useAuth } from "@/components/auth-provider";
import { ProductCard } from "@/components/product-card";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { apiFetch } from "@/lib/api";
import type { WishlistItem } from "@/lib/types";

export function WishlistPage() {
  const { accessToken } = useAuth();
  const queryClient = useQueryClient();
  const wishlist = useQuery({
    queryKey: ["account", "wishlist"],
    queryFn: () =>
      apiFetch<WishlistItem[]>("/account/wishlist", {}, accessToken),
    enabled: Boolean(accessToken),
  });
  const remove = useMutation({
    mutationFn: (productId: number) =>
      apiFetch<null>(
        `/account/wishlist/${productId}`,
        { method: "DELETE" },
        accessToken,
      ),
    onSuccess: async () => {
      toast.success("Removed from wishlist");
      await queryClient.invalidateQueries({
        queryKey: ["account", "wishlist"],
      });
    },
    onError: (error: Error) => toast.error(error.message),
  });
  return (
    <AccountShell active="wishlist">
      <p className="text-xs font-bold uppercase tracking-[0.22em] text-accent">
        Saved for later
      </p>
      <h1 className="display mt-2 text-5xl">Your wishlist.</h1>
      {wishlist.isLoading ? (
        <p className="mt-8">Loading wishlist…</p>
      ) : wishlist.data?.length ? (
        <div className="mt-8 grid gap-7 sm:grid-cols-2 xl:grid-cols-3">
          {wishlist.data.map((item) => (
            <div key={item.id}>
              <ProductCard product={item.product} />
              <Button
                variant="ghost"
                className="mt-2 w-full text-red-700"
                onClick={() => remove.mutate(item.productId)}
              >
                <Trash2 size={15} /> Remove
              </Button>
            </div>
          ))}
        </div>
      ) : (
        <div className="mt-8">
          <EmptyState
            icon={<Heart />}
            title="Your wishlist is empty"
            description="Save products from the catalog to revisit them here."
          />
        </div>
      )}
    </AccountShell>
  );
}
