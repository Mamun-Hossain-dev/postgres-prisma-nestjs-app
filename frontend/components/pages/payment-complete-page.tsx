"use client";

import { Suspense, useEffect } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { useRouter, useSearchParams } from "next/navigation";
import { Clock3, XCircle } from "lucide-react";
import { useAuth } from "@/components/auth-provider";
import { useCart } from "@/components/cart-provider";
import { apiFetch } from "@/lib/api";
import type { Payment } from "@/lib/types";
import { Skeleton } from "@/components/ui/skeleton";

const finalStatuses = new Set(["SUCCEEDED", "FAILED", "CANCELLED"]);
const CHECKOUT_SELECTION_KEY = "devicedock-checkout-product-ids";
const CHECKOUT_IDEMPOTENCY_KEY = "devicedock-checkout-idempotency";

export function PaymentCompletePage() {
  return (
    <Suspense fallback={<PaymentStatusSkeleton />}>
      <PaymentCompleteContent />
    </Suspense>
  );
}

function PaymentCompleteContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const paymentId = searchParams.get("paymentId");
  const { accessToken } = useAuth();
  const { removeItems } = useCart();
  const payment = useQuery({
    queryKey: ["payment", paymentId],
    queryFn: () => apiFetch<Payment>(`/payments/${paymentId}`, {}, accessToken),
    enabled: Boolean(accessToken && paymentId),
    refetchInterval: (query) =>
      query.state.data && finalStatuses.has(query.state.data.status)
        ? false
        : 2_000,
  });

  useEffect(() => {
    if (!paymentId || !payment.data) return;
    if (payment.data.status === "SUCCEEDED") {
      removeItems(readSelectedProductIds());
      window.sessionStorage.removeItem(CHECKOUT_SELECTION_KEY);
      window.sessionStorage.removeItem(CHECKOUT_IDEMPOTENCY_KEY);
      router.replace(`/payment/success?paymentId=${paymentId}`);
    } else if (
      payment.data.status === "FAILED" ||
      payment.data.status === "CANCELLED"
    ) {
      window.sessionStorage.removeItem(CHECKOUT_IDEMPOTENCY_KEY);
      router.replace(`/payment/failure?paymentId=${paymentId}`);
    }
  }, [payment.data, paymentId, removeItems, router]);

  if (payment.isError) {
    return (
      <div className="mx-auto flex min-h-[70vh] max-w-xl items-center px-5 text-center">
        <div>
          <XCircle className="mx-auto text-red-600" size={48} />
          <h1 className="display mt-5 text-4xl">Payment status unavailable.</h1>
          <p className="mt-4 text-sm text-black/50">{payment.error.message}</p>
          <Link
            href="/account/orders"
            className="mt-7 inline-block rounded-full bg-ink px-6 py-3 text-sm font-bold text-white"
          >
            View orders
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto flex min-h-[70vh] max-w-2xl items-center px-5 py-16">
      <section className="w-full rounded-[2.25rem] border bg-white/65 p-8 text-center shadow-soft sm:p-12">
        <Clock3 className="mx-auto animate-pulse text-accent" size={52} />
        <p className="mt-7 text-xs font-bold uppercase tracking-[0.22em] text-accent">
          Secure verification
        </p>
        <h1 className="display mt-3 text-5xl">Confirming your payment.</h1>
        <p className="mx-auto mt-5 max-w-lg text-sm leading-7 text-black/50">
          We are waiting for Stripe&apos;s verified webhook. You will be
          redirected automatically when the final status is available.
        </p>
      </section>
    </div>
  );
}

function PaymentStatusSkeleton() {
  return (
    <div className="mx-auto flex min-h-[70vh] max-w-2xl items-center px-5 py-16">
      <div className="w-full rounded-[2.25rem] border bg-white/65 p-8 text-center shadow-soft sm:p-12">
        <Skeleton className="mx-auto h-14 w-14 rounded-full" />
        <Skeleton className="mx-auto mt-7 h-3 w-32" />
        <Skeleton className="mx-auto mt-5 h-12 w-4/5 rounded-2xl" />
        <Skeleton className="mx-auto mt-5 h-4 w-full max-w-lg" />
        <Skeleton className="mx-auto mt-3 h-4 w-2/3 max-w-sm" />
      </div>
    </div>
  );
}

function readSelectedProductIds(): number[] {
  try {
    const value = JSON.parse(
      window.sessionStorage.getItem(CHECKOUT_SELECTION_KEY) ?? "[]",
    ) as unknown;
    return Array.isArray(value)
      ? value.filter((id): id is number => Number.isInteger(id))
      : [];
  } catch {
    return [];
  }
}
