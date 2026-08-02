"use client";

import { Heart } from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useAuth } from "@/components/auth-provider";
import { apiFetch } from "@/lib/api";

export function AddToWishlistButton({ productId }: { productId: number }) {
  const { user, accessToken } = useAuth();
  const router = useRouter();
  const save = async () => {
    if (!user) {
      toast("Please sign in to save products");
      router.push("/login?callbackUrl=%2Fshop");
      return;
    }
    try {
      await apiFetch(
        "/account/wishlist",
        { method: "POST", body: JSON.stringify({ productId }) },
        accessToken,
      );
      toast.success("Saved to your wishlist");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Unable to save product",
      );
    }
  };
  return (
    <button
      type="button"
      onClick={(event) => {
        event.preventDefault();
        event.stopPropagation();
        void save();
      }}
      aria-label="Save to wishlist"
      className="absolute right-4 top-16 z-10 grid h-9 w-9 place-items-center rounded-full bg-white/90 text-ink shadow-md transition hover:bg-ink hover:text-white"
    >
      <Heart size={16} />
    </button>
  );
}
