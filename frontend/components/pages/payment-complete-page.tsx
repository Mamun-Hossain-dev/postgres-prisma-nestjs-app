'use client';

import { Suspense, useEffect } from 'react';
import Link from 'next/link';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useSearchParams } from 'next/navigation';
import { CheckCircle2, Clock3, XCircle } from 'lucide-react';
import { useAuth } from '@/components/auth-provider';
import { apiFetch, minorMoney } from '@/lib/api';
import type { Payment } from '@/lib/types';

const finalStatuses = new Set(['SUCCEEDED', 'FAILED', 'CANCELLED']);

export function PaymentCompletePage() {
  return (
    <Suspense fallback={<PaymentStatusSkeleton />}>
      <PaymentCompleteContent />
    </Suspense>
  );
}

function PaymentCompleteContent() {
  const searchParams = useSearchParams();
  const paymentId = searchParams.get('paymentId');
  const { accessToken } = useAuth();
  const queryClient = useQueryClient();
  const payment = useQuery({
    queryKey: ['payment', paymentId],
    queryFn: () => apiFetch<Payment>(`/payments/${paymentId}`, {}, accessToken),
    enabled: Boolean(accessToken && paymentId),
    refetchInterval: (query) =>
      query.state.data && finalStatuses.has(query.state.data.status)
        ? false
        : 2_000,
  });
  const succeeded = payment.data?.status === 'SUCCEEDED';

  useEffect(() => {
    if (!succeeded) return;
    void queryClient.invalidateQueries({ queryKey: ['cart'] });
    void queryClient.invalidateQueries({ queryKey: ['orders'] });
  }, [queryClient, succeeded]);

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
  if (payment.isLoading || !payment.data) return <PaymentStatusSkeleton />;
  const failed =
    payment.data.status === 'FAILED' || payment.data.status === 'CANCELLED';
  return (
    <div className="mx-auto flex min-h-[70vh] max-w-2xl items-center px-5 py-16">
      <section className="w-full rounded-[2.25rem] border bg-white/65 p-8 text-center shadow-soft sm:p-12">
        {succeeded ? (
          <CheckCircle2 className="mx-auto text-emerald-600" size={52} />
        ) : failed ? (
          <XCircle className="mx-auto text-red-600" size={52} />
        ) : (
          <Clock3 className="mx-auto animate-pulse text-accent" size={52} />
        )}
        <p className="mt-7 text-xs font-bold uppercase tracking-[0.22em] text-accent">
          {payment.data.order.orderNumber}
        </p>
        <h1 className="display mt-3 text-5xl">
          {succeeded
            ? 'Payment confirmed.'
            : failed
              ? 'Payment was not completed.'
              : 'Confirming your payment.'}
        </h1>
        <p className="mx-auto mt-5 max-w-lg text-sm leading-7 text-black/50">
          {succeeded
            ? 'Stripe verified the payment. Your order and PDF invoice are now available.'
            : failed
              ? (payment.data.failureMessage ??
                'You can return to your cart and start a new checkout.')
              : 'We are waiting for the verified Stripe webhook. This page updates automatically.'}
        </p>
        <p className="mt-6 text-xl font-bold">
          {minorMoney(payment.data.amount, payment.data.currency)}
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          {succeeded && (
            <Link
              href="/account/orders"
              className="rounded-full bg-ink px-6 py-3 text-sm font-bold text-white"
            >
              View orders
            </Link>
          )}
          {failed && (
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

function PaymentStatusSkeleton() {
  return (
    <div className="mx-auto min-h-[70vh] max-w-2xl px-5 py-16">
      <div className="h-[30rem] animate-pulse rounded-[2rem] bg-black/5" />
    </div>
  );
}
