"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Minus, Plus, ShoppingBag, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { money } from "@/lib/api";
import { useAuth } from "@/components/auth-provider";
import { useCart } from "@/components/cart-provider";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { ListSkeleton, Skeleton } from "@/components/ui/skeleton";

const CHECKOUT_SELECTION_KEY = "devicedock-checkout-product-ids";
const CHECKOUT_IDEMPOTENCY_KEY = "devicedock-checkout-idempotency";

export function CartPage() {
  const { user } = useAuth();
  const { items, hydrated, updateQuantity, removeItem, clear } = useCart();
  const router = useRouter();
  const [clearOpen, setClearOpen] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const initializedSelection = useRef(false);

  useEffect(() => {
    if (!hydrated || initializedSelection.current) return;
    setSelectedIds(new Set(items.map((item) => item.productId)));
    initializedSelection.current = true;
  }, [hydrated, items]);

  useEffect(() => {
    if (!initializedSelection.current) return;
    const availableIds = new Set(items.map((item) => item.productId));
    setSelectedIds(
      (current) => new Set([...current].filter((id) => availableIds.has(id))),
    );
  }, [items]);

  if (!hydrated) {
    return (
      <div className="mx-auto min-h-[70vh] max-w-6xl px-5 py-14 lg:px-8">
        <Skeleton className="h-3 w-24" />
        <Skeleton className="mt-4 h-14 w-64 rounded-2xl" />
        <div className="mt-10 grid gap-6 lg:grid-cols-[1fr_21rem]">
          <div className="overflow-hidden rounded-[2rem] border bg-white/55">
            <ListSkeleton rows={3} />
          </div>
          <Skeleton className="h-80 rounded-[2rem]" />
        </div>
      </div>
    );
  }

  if (!items.length) {
    return (
      <div className="mx-auto flex min-h-[70vh] max-w-xl flex-col items-center justify-center px-5 text-center">
        <ShoppingBag className="text-accent" size={38} />
        <p className="mt-6 text-xs font-bold uppercase tracking-[0.22em] text-accent">
          Your cart
        </p>
        <h1 className="display mt-3 text-6xl">A little too quiet.</h1>
        <p className="mt-5 text-black/50">
          Add a device or two and they will appear here.
        </p>
        <Link
          href="/shop"
          className="mt-8 flex items-center gap-2 rounded-full bg-ink px-7 py-4 font-bold text-white"
        >
          Explore products <ArrowRight size={17} />
        </Link>
      </div>
    );
  }

  const selectedItems = items.filter((item) => selectedIds.has(item.productId));
  const selectedCount = selectedItems.reduce(
    (sum, item) => sum + item.quantity,
    0,
  );
  const selectedSubtotal = selectedItems.reduce(
    (sum, item) => sum + item.product.price * item.quantity,
    0,
  );
  const allSelected = selectedIds.size === items.length;

  const toggleItem = (productId: number) => {
    setSelectedIds((current) => {
      const next = new Set(current);
      if (next.has(productId)) next.delete(productId);
      else next.add(productId);
      return next;
    });
  };

  const continueToCheckout = () => {
    if (!selectedItems.length) {
      toast.error("Select at least one product to continue");
      return;
    }
    window.sessionStorage.setItem(
      CHECKOUT_SELECTION_KEY,
      JSON.stringify(selectedItems.map((item) => item.productId)),
    );
    window.sessionStorage.removeItem(CHECKOUT_IDEMPOTENCY_KEY);
    if (!user) {
      toast("Please sign in to continue");
      router.push("/login?callbackUrl=%2Fcheckout");
      return;
    }
    router.push("/checkout");
  };

  return (
    <div className="px-5 py-12 lg:px-8 lg:py-16">
      <p className="text-xs font-bold uppercase tracking-[0.22em] text-accent">
        Your selection
      </p>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="display mt-3 text-5xl sm:text-6xl">Shopping cart.</h1>
          <p className="mt-3 text-sm text-black/45">
            Choose only the products you want to check out now.
          </p>
        </div>
        <Button
          variant="ghost"
          className="text-red-700"
          onClick={() => setClearOpen(true)}
        >
          <Trash2 size={16} /> Clear cart
        </Button>
      </div>

      <div className="mt-10 grid gap-10 lg:grid-cols-[1fr_360px]">
        <section>
          <label className="mb-3 flex w-fit cursor-pointer items-center gap-3 rounded-full border bg-white/55 px-4 py-2 text-xs font-bold">
            <input
              type="checkbox"
              checked={allSelected}
              onChange={() =>
                setSelectedIds(
                  allSelected
                    ? new Set()
                    : new Set(items.map((item) => item.productId)),
                )
              }
              className="h-4 w-4 accent-[#b4472f]"
            />
            Select all products
          </label>
          <div className="divide-y border-y">
            {items.map((item) => {
              const image = item.product.images[0]?.url;
              const selected = selectedIds.has(item.productId);
              return (
                <article
                  key={item.productId}
                  className={`grid grid-cols-[24px_88px_1fr] gap-4 py-5 transition sm:grid-cols-[24px_120px_1fr_auto] ${selected ? "" : "opacity-55"}`}
                >
                  <input
                    type="checkbox"
                    checked={selected}
                    onChange={() => toggleItem(item.productId)}
                    aria-label={`Select ${item.product.title} for checkout`}
                    className="mt-2 h-4 w-4 accent-[#b4472f]"
                  />
                  <Link
                    href={`/products/${item.productId}`}
                    className="relative aspect-square overflow-hidden rounded-2xl bg-[#d9d1c1]"
                  >
                    {image ? (
                      <Image
                        src={image}
                        alt={item.product.title}
                        fill
                        className="object-cover"
                      />
                    ) : (
                      <div className="absolute inset-[24%] rotate-6 rounded-2xl bg-ink" />
                    )}
                  </Link>
                  <div className="self-center">
                    <p className="text-[11px] font-bold uppercase tracking-wider text-black/40">
                      {item.product.brand}
                    </p>
                    <Link href={`/products/${item.productId}`}>
                      <h2 className="display mt-1 text-xl sm:text-2xl">
                        {item.product.title}
                      </h2>
                    </Link>
                    <p className="mt-2 text-sm font-bold">
                      {money(item.product.price)}
                    </p>
                    <div className="mt-4 flex w-28 items-center justify-between rounded-full border bg-white/35 p-1">
                      <button
                        type="button"
                        disabled={item.quantity === 1}
                        onClick={() =>
                          updateQuantity(item.productId, item.quantity - 1)
                        }
                        className="grid h-8 w-8 place-items-center rounded-full hover:bg-white disabled:opacity-30"
                        aria-label={`Decrease ${item.product.title} quantity`}
                      >
                        <Minus size={14} />
                      </button>
                      <span className="text-sm font-bold">{item.quantity}</span>
                      <button
                        type="button"
                        disabled={item.quantity >= item.product.quantity}
                        onClick={() =>
                          updateQuantity(item.productId, item.quantity + 1)
                        }
                        className="grid h-8 w-8 place-items-center rounded-full hover:bg-white disabled:opacity-30"
                        aria-label={`Increase ${item.product.title} quantity`}
                      >
                        <Plus size={14} />
                      </button>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => removeItem(item.productId)}
                    className="col-start-3 flex items-center gap-2 self-center text-xs font-bold text-black/45 hover:text-red-600 sm:col-start-auto"
                  >
                    <Trash2 size={16} /> Remove
                  </button>
                </article>
              );
            })}
          </div>
        </section>

        <aside className="h-fit rounded-[2rem] bg-ink p-7 text-white lg:sticky lg:top-28">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-white/45">
            Checkout summary
          </p>
          <div className="mt-7 space-y-4 text-sm">
            <div className="flex justify-between">
              <span className="text-white/55">Selected items</span>
              <span>{selectedCount}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-white/55">Delivery</span>
              <span>Calculated later</span>
            </div>
          </div>
          <div className="my-6 h-px bg-white/15" />
          <div className="flex items-end justify-between">
            <span className="font-semibold">Selected subtotal</span>
            <span className="display text-3xl">{money(selectedSubtotal)}</span>
          </div>
          <button
            type="button"
            onClick={continueToCheckout}
            disabled={!selectedItems.length}
            className="mt-7 w-full rounded-full bg-white px-6 py-4 font-bold text-ink transition hover:bg-accent hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
          >
            Continue to checkout
          </button>
          <p className="mt-4 text-center text-xs leading-5 text-white/35">
            No payment happens on this page. You can review your selected
            products again before paying.
          </p>
        </aside>
      </div>

      <ConfirmDialog
        open={clearOpen}
        onOpenChange={setClearOpen}
        title="Clear your cart?"
        description="Every locally saved product will be removed from this device."
        confirmLabel="Clear cart"
        danger
        onConfirm={() => {
          clear();
          setClearOpen(false);
          toast.success("Cart cleared");
        }}
      />
    </div>
  );
}
