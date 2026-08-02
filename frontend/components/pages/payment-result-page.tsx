"use client";

import Link from "next/link";
import { Suspense } from "react";
import { useQuery } from "@tanstack/react-query";
import { useSearchParams } from "next/navigation";
import { CheckCircle2, XCircle } from "lucide-react";
import { useAuth } from "@/components/auth-provider";
import { apiFetch, minorMoney } from "@/lib/api";
import type { Payment } from "@/lib/types";
import { Skeleton } from "@/components/ui/skeleton";

export function PaymentResultPage({ kind }: { kind: "success" | "failure" }) {
  return (
    <Suspense fallback={<ResultLoading />}>
      <PaymentResult kind={kind} />
    </Suspense>
  );
}

function PaymentResult({ kind }: { kind: "success" | "failure" }) {
  const searchParams = useSearchParams();
  const paymentId = searchParams.get("paymentId");
  const reason = searchParams.get("reason");
  const { accessToken } = useAuth();
  const payment = useQuery({
    queryKey: ["payment", paymentId, "result"],
    queryFn: () => apiFetch<Payment>(`/payments/${paymentId}`, {}, accessToken),
    enabled: Boolean(accessToken && paymentId),
  });

  if (payment.isLoading) return <ResultLoading />;
  const verifiedSuccess = payment.data?.status === "SUCCEEDED";
  const isSuccess = kind === "success" && verifiedSuccess;
  const isCashOnDelivery =
    isSuccess && payment.data?.order.paymentMethod === "CASH_ON_DELIVERY";
  const message = isSuccess
    ? isCashOnDelivery
      ? `Your delivery charge is paid and the order is confirmed. Pay ${minorMoney(payment.data!.order.subtotalAmount, payment.data!.currency)} in cash on delivery.`
      : "Stripe verified your card payment. Your order and PDF invoice are now available."
    : (reason ??
      payment.data?.failureMessage ??
      (kind === "success"
        ? "This payment has not been verified as successful."
        : "Your payment was not completed. Your cart items are still available."));

  return (
    <div className="mx-auto flex min-h-[70vh] max-w-2xl items-center px-5 py-16">
      <section className="w-full rounded-[2.25rem] border bg-white/65 p-8 text-center shadow-soft sm:p-12">
        {isSuccess ? (
          <CheckCircle2 className="mx-auto text-emerald-600" size={54} />
        ) : (
          <XCircle className="mx-auto text-red-600" size={54} />
        )}
        <p className="mt-7 text-xs font-bold uppercase tracking-[0.22em] text-accent">
          {payment.data?.order.orderNumber ?? "Payment result"}
        </p>
        <h1 className="display mt-3 text-5xl">
          {isSuccess
            ? isCashOnDelivery
              ? "Cash on delivery confirmed."
              : "Payment successful."
            : "Payment was not completed."}
        </h1>
        <p className="mx-auto mt-5 max-w-lg text-sm leading-7 text-black/50">
          {payment.isError ? payment.error.message : message}
        </p>
        {payment.data && (
          <p className="mt-6 text-xl font-bold">
            {minorMoney(payment.data.amount, payment.data.currency)}
          </p>
        )}
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          {isSuccess ? (
            <Link
              href="/account/orders"
              className="rounded-full bg-ink px-6 py-3 text-sm font-bold text-white"
            >
              {isCashOnDelivery ? "View order" : "View order and invoice"}
            </Link>
          ) : (
            <Link
              href="/cart"
              className="rounded-full bg-ink px-6 py-3 text-sm font-bold text-white"
            >
              Return to cart
            </Link>
          )}
          <Link
            href="/shop"
            className="rounded-full border px-6 py-3 text-sm font-bold"
          >
            Continue shopping
          </Link>
        </div>
      </section>
    </div>
  );
}

function ResultLoading() {
  return (
    <div className="mx-auto flex min-h-[70vh] max-w-2xl items-center px-5 py-16">
      <div className="w-full rounded-[2.25rem] border bg-white/65 p-8 text-center shadow-soft sm:p-12">
        <Skeleton className="mx-auto h-14 w-14 rounded-full" />
        <Skeleton className="mx-auto mt-7 h-3 w-32" />
        <Skeleton className="mx-auto mt-5 h-12 w-4/5 rounded-2xl" />
        <Skeleton className="mx-auto mt-5 h-4 w-full max-w-lg" />
        <Skeleton className="mx-auto mt-3 h-4 w-3/4 max-w-md" />
        <Skeleton className="mx-auto mt-8 h-11 w-52 rounded-full" />
      </div>
    </div>
  );
}
