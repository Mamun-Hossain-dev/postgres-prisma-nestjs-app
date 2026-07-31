'use client';

import { Suspense, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useSearchParams } from 'next/navigation';
import {
  Elements,
  PaymentElement,
  useElements,
  useStripe,
} from '@stripe/react-stripe-js';
import { LockKeyhole, ShieldCheck } from 'lucide-react';
import { useAuth } from '@/components/auth-provider';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import { apiFetch, minorMoney } from '@/lib/api';
import { stripePromise } from '@/lib/stripe';
import type { CheckoutSession } from '@/lib/types';

export function CheckoutPage() {
  return (
    <Suspense fallback={<CheckoutSkeleton />}>
      <CheckoutContent />
    </Suspense>
  );
}

function CheckoutContent() {
  const searchParams = useSearchParams();
  const paymentId = searchParams.get('paymentId');
  const { accessToken } = useAuth();
  const session = useQuery({
    queryKey: ['payment', paymentId, 'session'],
    queryFn: () =>
      apiFetch<CheckoutSession>(
        `/payments/${paymentId}/session`,
        {},
        accessToken,
      ),
    enabled: Boolean(accessToken && paymentId),
    staleTime: 60_000,
  });

  if (!stripePromise) {
    return (
      <CheckoutError message="Stripe publishable key is not configured." />
    );
  }
  if (!paymentId) {
    return <CheckoutError message="This checkout link is invalid." />;
  }
  if (session.isLoading) return <CheckoutSkeleton />;
  if (session.isError || !session.data) {
    return (
      <CheckoutError
        message={session.error?.message ?? 'Checkout could not be loaded.'}
      />
    );
  }

  return (
    <div className="mx-auto min-h-[70vh] max-w-5xl px-5 py-14 lg:px-8">
      <div className="grid gap-8 lg:grid-cols-[1fr_320px]">
        <section className="rounded-[2rem] border bg-white/65 p-6 shadow-soft sm:p-9">
          <p className="text-xs font-bold uppercase tracking-[0.22em] text-accent">
            Secure payment
          </p>
          <h1 className="display mt-3 text-5xl">Complete your order.</h1>
          <Elements
            stripe={stripePromise}
            options={{
              clientSecret: session.data.clientSecret,
              appearance: {
                theme: 'stripe',
                variables: {
                  colorPrimary: '#b4472f',
                  borderRadius: '14px',
                  fontFamily: 'Inter, sans-serif',
                },
              },
            }}
          >
            <StripePaymentForm paymentId={session.data.paymentId} />
          </Elements>
        </section>
        <aside className="h-fit rounded-[2rem] bg-ink p-7 text-white">
          <LockKeyhole className="text-accent" />
          <p className="mt-6 text-xs font-bold uppercase tracking-wider text-white/40">
            Order
          </p>
          <p className="mt-2 font-bold">{session.data.orderNumber}</p>
          <div className="my-5 h-px bg-white/10" />
          <div className="flex items-end justify-between">
            <span className="text-sm text-white/55">Total</span>
            <span className="display text-3xl">
              {minorMoney(session.data.amount, session.data.currency)}
            </span>
          </div>
          <p className="mt-6 flex gap-2 text-xs leading-5 text-white/40">
            <ShieldCheck size={16} className="shrink-0" />
            Card details go directly to Stripe and are never stored by
            DeviceDock.
          </p>
        </aside>
      </div>
    </div>
  );
}

function StripePaymentForm({ paymentId }: { paymentId: number }) {
  const stripe = useStripe();
  const elements = useElements();
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const pay = async () => {
    if (!stripe || !elements) return;
    setSubmitting(true);
    setError(null);
    const result = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: `${window.location.origin}/checkout/complete?paymentId=${paymentId}`,
      },
    });
    if (result.error) {
      setError(result.error.message ?? 'Payment could not be confirmed.');
      setSubmitting(false);
    }
  };

  return (
    <div className="mt-9">
      <PaymentElement />
      {error && (
        <p className="mt-4 text-sm font-medium text-red-600" role="alert">
          {error}
        </p>
      )}
      <Button
        type="button"
        onClick={() => void pay()}
        loading={submitting}
        disabled={!stripe || !elements}
        className="mt-6 h-12 w-full"
      >
        Pay securely
      </Button>
      <p className="mt-4 text-center text-xs text-black/40">
        The webhook—not this browser response—confirms your payment.
      </p>
    </div>
  );
}

function CheckoutSkeleton() {
  return (
    <div className="mx-auto min-h-[70vh] max-w-5xl px-5 py-14">
      <div className="h-[34rem] animate-pulse rounded-[2rem] bg-black/5" />
    </div>
  );
}

function CheckoutError({ message }: { message: string }) {
  return (
    <div className="mx-auto min-h-[70vh] max-w-2xl px-5 py-20">
      <EmptyState
        icon={<LockKeyhole />}
        title="Checkout unavailable"
        description={message}
      />
    </div>
  );
}
