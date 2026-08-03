"use client";

import Link from "next/link";
import {
  Suspense,
  useEffect,
  useMemo,
  useState,
  type Dispatch,
  type ReactNode,
  type SetStateAction,
} from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Elements,
  PaymentElement,
  useElements,
  useStripe,
} from "@stripe/react-stripe-js";
import {
  ChevronLeft,
  CreditCard,
  LockKeyhole,
  MapPin,
  ShieldCheck,
  Truck,
} from "lucide-react";
import { useAuth } from "@/components/auth-provider";
import { useCart } from "@/components/cart-provider";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Field, Input } from "@/components/ui/field";
import { ApiError, apiFetch, minorMoney } from "@/lib/api";
import { CHECKOUT_COUPON_KEY } from "@/lib/checkout-storage";
import { stripePromise } from "@/lib/stripe";
import type { Address, CheckoutSession, PublicCoupon } from "@/lib/types";

const CHECKOUT_SELECTION_KEY = "devicedock-checkout-product-ids";
const CHECKOUT_IDEMPOTENCY_KEY = "devicedock-checkout-idempotency";

interface DeliveryDetails {
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  deliveryAddressLine: string;
  deliveryArea: string;
  deliveryCity: string;
  deliveryPostalCode: string;
}

export function CheckoutPage() {
  return (
    <Suspense fallback={<CheckoutSkeleton />}>
      <CheckoutContent />
    </Suspense>
  );
}

function CheckoutContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const paymentId = searchParams.get("paymentId");
  const { accessToken, user } = useAuth();
  const { items, hydrated } = useCart();
  const [selectedIds, setSelectedIds] = useState<number[] | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<
    "CARD" | "CASH_ON_DELIVERY"
  >("CARD");
  const [deliveryZone, setDeliveryZone] = useState<"DHAKA" | "OUTSIDE_DHAKA">(
    "DHAKA",
  );
  const [couponCode, setCouponCode] = useState("");
  const [selectedAddressId, setSelectedAddressId] = useState<number | null>(
    null,
  );
  const [addressesInitialized, setAddressesInitialized] = useState(false);
  const [deliveryDetails, setDeliveryDetails] = useState<DeliveryDetails>({
    customerName: "",
    customerEmail: "",
    customerPhone: "",
    deliveryAddressLine: "",
    deliveryArea: "",
    deliveryCity: "",
    deliveryPostalCode: "",
  });

  useEffect(() => {
    setSelectedIds(readSelectedProductIds());
    setCouponCode(
      window.sessionStorage.getItem(CHECKOUT_COUPON_KEY)?.toUpperCase() ?? "",
    );
  }, []);

  useEffect(() => {
    if (!user) return;
    setDeliveryDetails((current) => ({
      ...current,
      customerName: current.customerName || user.name,
      customerEmail: current.customerEmail || user.email,
      customerPhone: current.customerPhone || user.phone || "",
    }));
  }, [user]);

  const addresses = useQuery({
    queryKey: ["account", "addresses"],
    queryFn: () => apiFetch<Address[]>("/account/addresses", {}, accessToken),
    enabled: Boolean(accessToken),
    staleTime: 60_000,
  });

  useEffect(() => {
    if (addressesInitialized || !addresses.data) return;
    const preferred =
      addresses.data.find((address) => address.isDefault) ?? addresses.data[0];
    if (preferred) {
      setSelectedAddressId(preferred.id);
      setDeliveryZone(preferred.deliveryZone);
      setDeliveryDetails((current) => ({
        ...current,
        customerName: preferred.recipientName,
        customerPhone: preferred.phone,
        deliveryAddressLine: preferred.addressLine,
        deliveryArea: preferred.area,
        deliveryCity: preferred.city,
        deliveryPostalCode: preferred.postalCode ?? "",
      }));
    }
    setAddressesInitialized(true);
  }, [addresses.data, addressesInitialized]);

  const availableCoupons = useQuery({
    queryKey: ["operations", "coupons", "available"],
    queryFn: () => apiFetch<PublicCoupon[]>("/operations/coupons/available"),
    staleTime: 60_000,
  });

  const selectedItems = useMemo(
    () =>
      selectedIds === null
        ? []
        : items.filter((item) => selectedIds.includes(item.productId)),
    [items, selectedIds],
  );
  const restoredSession = useQuery({
    queryKey: ["payment", paymentId, "session"],
    queryFn: () =>
      apiFetch<CheckoutSession>(
        `/payments/${paymentId}/session`,
        {},
        accessToken,
      ),
    enabled: Boolean(accessToken && paymentId),
    staleTime: 60_000,
  });
  const outdatedSession =
    restoredSession.error instanceof ApiError &&
    restoredSession.error.status === 409 &&
    restoredSession.error.code !== "PAYMENT_ALREADY_SUCCEEDED";
  const completedPaymentId =
    restoredSession.error instanceof ApiError &&
    restoredSession.error.code === "PAYMENT_ALREADY_SUCCEEDED"
      ? readPaymentId(restoredSession.error.details)
      : null;

  useEffect(() => {
    if (!outdatedSession) return;
    window.sessionStorage.removeItem(CHECKOUT_IDEMPOTENCY_KEY);
    router.replace("/checkout");
  }, [outdatedSession, router]);

  useEffect(() => {
    if (!completedPaymentId) return;
    router.replace(`/checkout/complete?paymentId=${completedPaymentId}`);
  }, [completedPaymentId, router]);

  const checkout = useMutation({
    mutationFn: () => {
      const idempotencyKey =
        window.sessionStorage.getItem(CHECKOUT_IDEMPOTENCY_KEY) ??
        crypto.randomUUID();
      window.sessionStorage.setItem(CHECKOUT_IDEMPOTENCY_KEY, idempotencyKey);
      return apiFetch<CheckoutSession>(
        "/payments/checkout",
        {
          method: "POST",
          body: JSON.stringify({
            idempotencyKey,
            paymentMethod,
            deliveryZone,
            ...deliveryDetails,
            deliveryPostalCode:
              deliveryDetails.deliveryPostalCode.trim() || undefined,
            ...(couponCode.trim()
              ? { couponCode: couponCode.trim().toUpperCase() }
              : {}),
            items: selectedItems.map((item) => ({
              productId: item.productId,
              quantity: item.quantity,
            })),
          }),
        },
        accessToken,
      );
    },
    onSuccess: (session) => {
      router.replace(`/checkout?paymentId=${session.paymentId}`);
    },
    onError: (error: Error) => {
      if (
        error instanceof ApiError &&
        error.code === "PAYMENT_ALREADY_SUCCEEDED"
      ) {
        const succeededPaymentId = readPaymentId(error.details);
        if (succeededPaymentId) {
          router.replace(`/checkout/complete?paymentId=${succeededPaymentId}`);
          return;
        }
      }
      if (
        error instanceof ApiError &&
        (error.status < 500 || error.status === 502)
      ) {
        window.sessionStorage.removeItem(CHECKOUT_IDEMPOTENCY_KEY);
      }
    },
  });

  if (!stripePromise) {
    return (
      <CheckoutError message="Stripe publishable key is not configured." />
    );
  }
  if (!paymentId && hydrated && selectedIds !== null && !selectedItems.length) {
    return <CheckoutError message="Select products from your cart first." />;
  }
  if (outdatedSession) {
    return <CheckoutSkeleton />;
  }
  if (restoredSession.isError) {
    return <CheckoutError message={restoredSession.error.message} />;
  }

  const session = checkout.data ?? restoredSession.data;
  if (!session) {
    if (!hydrated || selectedIds === null || checkout.isPending) {
      return <CheckoutSkeleton />;
    }
    return (
      <div className="mx-auto min-h-[70vh] max-w-3xl px-5 py-12 lg:px-8">
        <Link
          href="/cart"
          className="inline-flex items-center gap-1 text-sm font-bold text-black/45 hover:text-ink"
        >
          <ChevronLeft size={17} aria-hidden="true" /> Back to cart
        </Link>
        <section className="mt-7 rounded-[2rem] border bg-white/65 p-6 shadow-soft sm:p-9">
          <p className="text-xs font-bold uppercase tracking-[0.22em] text-accent">
            Delivery & payment
          </p>
          <h1 className="display mt-3 text-5xl">Complete your order.</h1>
          <p className="mt-4 text-sm leading-6 text-black/45">
            Confirm who will receive the order, the complete delivery address,
            and how you want to pay.
          </p>

          {!!addresses.data?.length && (
            <fieldset className="mt-8">
              <div className="flex items-center justify-between gap-4">
                <legend className="font-bold">Saved addresses</legend>
                <Link
                  href="/account/addresses"
                  className="text-xs font-bold text-accent hover:underline"
                >
                  Manage addresses
                </Link>
              </div>
              <div className="mt-3 grid gap-3 sm:grid-cols-2">
                {addresses.data.map((address) => (
                  <button
                    key={address.id}
                    type="button"
                    onClick={() => {
                      setSelectedAddressId(address.id);
                      setDeliveryZone(address.deliveryZone);
                      setDeliveryDetails((current) => ({
                        ...current,
                        customerName: address.recipientName,
                        customerPhone: address.phone,
                        deliveryAddressLine: address.addressLine,
                        deliveryArea: address.area,
                        deliveryCity: address.city,
                        deliveryPostalCode: address.postalCode ?? "",
                      }));
                    }}
                    className={`rounded-2xl border p-4 text-left transition ${
                      selectedAddressId === address.id
                        ? "border-accent bg-accent/5"
                        : "bg-white hover:border-black/25"
                    }`}
                  >
                    <span className="flex items-center gap-2 text-sm font-bold">
                      <MapPin size={16} className="text-accent" />
                      {address.label}
                      {address.isDefault && (
                        <span className="text-[10px] uppercase tracking-wider text-black/35">
                          Default
                        </span>
                      )}
                    </span>
                    <span className="mt-2 block text-xs leading-5 text-black/45">
                      {address.addressLine}, {address.area}, {address.city}
                    </span>
                  </button>
                ))}
              </div>
            </fieldset>
          )}

          <fieldset className="mt-8">
            <div className="flex items-center justify-between gap-4">
              <legend className="font-bold">Contact & delivery details</legend>
              {!addresses.data?.length && (
                <Link
                  href="/account/addresses"
                  className="text-xs font-bold text-accent hover:underline"
                >
                  Save an address
                </Link>
              )}
            </div>
            <div className="mt-3 grid gap-4 sm:grid-cols-2">
              <Field label="Recipient name">
                <Input
                  required
                  value={deliveryDetails.customerName}
                  onChange={(event) =>
                    updateDeliveryDetail(
                      setDeliveryDetails,
                      setSelectedAddressId,
                      "customerName",
                      event.target.value,
                    )
                  }
                />
              </Field>
              <Field label="Email address">
                <Input
                  required
                  type="email"
                  value={deliveryDetails.customerEmail}
                  onChange={(event) =>
                    updateDeliveryDetail(
                      setDeliveryDetails,
                      setSelectedAddressId,
                      "customerEmail",
                      event.target.value,
                    )
                  }
                />
              </Field>
              <Field label="Phone number">
                <Input
                  required
                  type="tel"
                  value={deliveryDetails.customerPhone}
                  onChange={(event) =>
                    updateDeliveryDetail(
                      setDeliveryDetails,
                      setSelectedAddressId,
                      "customerPhone",
                      event.target.value,
                    )
                  }
                />
              </Field>
              <Field label="Area">
                <Input
                  required
                  value={deliveryDetails.deliveryArea}
                  onChange={(event) =>
                    updateDeliveryDetail(
                      setDeliveryDetails,
                      setSelectedAddressId,
                      "deliveryArea",
                      event.target.value,
                    )
                  }
                />
              </Field>
              <div className="sm:col-span-2">
                <Field label="Full street address">
                  <Input
                    required
                    value={deliveryDetails.deliveryAddressLine}
                    placeholder="House, road, block or village"
                    onChange={(event) =>
                      updateDeliveryDetail(
                        setDeliveryDetails,
                        setSelectedAddressId,
                        "deliveryAddressLine",
                        event.target.value,
                      )
                    }
                  />
                </Field>
              </div>
              <Field label="City / district">
                <Input
                  required
                  value={deliveryDetails.deliveryCity}
                  onChange={(event) =>
                    updateDeliveryDetail(
                      setDeliveryDetails,
                      setSelectedAddressId,
                      "deliveryCity",
                      event.target.value,
                    )
                  }
                />
              </Field>
              <Field label="Postal code" hint="Optional">
                <Input
                  value={deliveryDetails.deliveryPostalCode}
                  onChange={(event) =>
                    updateDeliveryDetail(
                      setDeliveryDetails,
                      setSelectedAddressId,
                      "deliveryPostalCode",
                      event.target.value,
                    )
                  }
                />
              </Field>
            </div>
          </fieldset>

          <fieldset className="mt-8">
            <legend className="font-bold">Delivery area</legend>
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              <ChoiceButton
                selected={deliveryZone === "DHAKA"}
                onClick={() => {
                  setDeliveryZone("DHAKA");
                  setSelectedAddressId(null);
                }}
                icon={<MapPin size={20} />}
                title="Inside Dhaka"
                description="৳60 delivery charge"
              />
              <ChoiceButton
                selected={deliveryZone === "OUTSIDE_DHAKA"}
                onClick={() => {
                  setDeliveryZone("OUTSIDE_DHAKA");
                  setSelectedAddressId(null);
                }}
                icon={<Truck size={20} />}
                title="Outside Dhaka"
                description="৳120 delivery charge"
              />
            </div>
          </fieldset>

          <div className="mt-8 max-w-sm">
            <Field
              label="Coupon code"
              hint="Optional. The discount is verified before payment."
            >
              <Input
                value={couponCode}
                onChange={(event) => {
                  const value = event.target.value.toUpperCase();
                  setCouponCode(value);
                  if (value) {
                    window.sessionStorage.setItem(CHECKOUT_COUPON_KEY, value);
                  } else {
                    window.sessionStorage.removeItem(CHECKOUT_COUPON_KEY);
                  }
                }}
                placeholder="e.g. SAVE10"
                maxLength={32}
              />
            </Field>
            {!!availableCoupons.data?.length && (
              <div className="mt-3 flex flex-wrap gap-2">
                {availableCoupons.data.map((coupon) => (
                  <button
                    key={coupon.id}
                    type="button"
                    onClick={() => {
                      setCouponCode(coupon.code);
                      window.sessionStorage.setItem(
                        CHECKOUT_COUPON_KEY,
                        coupon.code,
                      );
                    }}
                    className={`rounded-full border px-3 py-1.5 text-xs font-bold transition ${
                      couponCode === coupon.code
                        ? "border-accent bg-accent text-white"
                        : "bg-white hover:border-accent hover:text-accent"
                    }`}
                  >
                    {coupon.code} · {formatCouponDiscount(coupon)}
                  </button>
                ))}
              </div>
            )}
          </div>

          <fieldset className="mt-8">
            <legend className="font-bold">Payment option</legend>
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              <ChoiceButton
                selected={paymentMethod === "CARD"}
                onClick={() => setPaymentMethod("CARD")}
                icon={<CreditCard size={20} />}
                title="Card payment"
                description="Pay the complete order now"
              />
              <ChoiceButton
                selected={paymentMethod === "CASH_ON_DELIVERY"}
                onClick={() => setPaymentMethod("CASH_ON_DELIVERY")}
                icon={<Truck size={20} />}
                title="Cash on delivery"
                description={
                  deliveryZone === "DHAKA"
                    ? "Pay a ৳100 deposit now, the rest on delivery"
                    : "Pay ৳120 delivery now, products on delivery"
                }
              />
            </div>
          </fieldset>

          {checkout.isError && (
            <p className="mt-5 text-sm font-medium text-red-600">
              {checkout.error.message}
            </p>
          )}
          <Button
            className="mt-8 h-12 w-full"
            disabled={
              !accessToken || !hasCompleteDeliveryDetails(deliveryDetails)
            }
            onClick={() => checkout.mutate()}
          >
            {paymentMethod === "CARD"
              ? "Continue to card payment"
              : "Continue to COD deposit"}
          </Button>
        </section>
      </div>
    );
  }

  return (
    <div className="mx-auto min-h-[70vh] max-w-6xl px-5 py-12 lg:px-8">
      <div className="mb-7">
        <Link
          href="/cart"
          className="inline-flex items-center gap-1 text-sm font-bold text-black/45 hover:text-ink"
        >
          <ChevronLeft size={17} aria-hidden="true" /> Back to cart
        </Link>
      </div>
      <div className="grid gap-8 lg:grid-cols-[1fr_360px]">
        <section className="rounded-[2rem] border bg-white/65 p-6 shadow-soft sm:p-9">
          <p className="text-xs font-bold uppercase tracking-[0.22em] text-accent">
            {session.paymentMethod === "CARD"
              ? "Secure card payment"
              : "Confirm cash on delivery"}
          </p>
          <h1 className="display mt-3 text-5xl">Complete your order.</h1>
          <p className="mt-4 max-w-xl text-sm leading-6 text-black/45">
            {session.paymentMethod === "CARD"
              ? "Pay your order total securely by card."
              : "Pay the card deposit shown in the summary now. It includes delivery and is deducted from the order total; pay the remaining balance on delivery."}
          </p>
          <Elements
            stripe={stripePromise}
            options={{
              clientSecret: session.clientSecret,
              appearance: {
                theme: "stripe",
                variables: {
                  colorPrimary: "#b4472f",
                  borderRadius: "14px",
                  fontFamily: "Inter, sans-serif",
                },
              },
            }}
          >
            <StripePaymentForm
              paymentId={session.paymentId}
              paymentMethod={session.paymentMethod}
            />
          </Elements>
        </section>

        <aside className="h-fit rounded-[2rem] bg-ink p-7 text-white lg:sticky lg:top-28">
          <LockKeyhole className="text-accent" />
          <p className="mt-6 text-xs font-bold uppercase tracking-wider text-white/40">
            {session.orderNumber}
          </p>
          {session.items.length > 0 && (
            <div className="mt-5 divide-y divide-white/10 border-y border-white/10">
              {session.items.map((item) => (
                <div key={item.id} className="flex gap-3 py-4">
                  <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-white/10 text-xs font-bold text-white/55">
                    {item.productSku.slice(0, 3).toUpperCase()}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-bold">
                      {item.productTitle}
                    </p>
                    <p className="mt-1 text-xs text-white/40">
                      Qty {item.quantity} ·{" "}
                      {minorMoney(item.unitAmount, session.currency)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
          <div className="mt-6 space-y-3 text-sm">
            <SummaryRow
              label="Products"
              value={minorMoney(session.subtotalAmount, session.currency)}
            />
            <SummaryRow
              label="Delivery"
              value={minorMoney(session.deliveryCharge, session.currency)}
            />
            {session.discountAmount > 0 && (
              <SummaryRow
                label="Coupon discount"
                value={`-${minorMoney(session.discountAmount, session.currency)}`}
              />
            )}
            <div className="flex items-end justify-between border-t border-white/10 pt-4">
              <span className="text-white/55">Order total</span>
              <span className="display text-2xl">
                {minorMoney(session.orderTotal, session.currency)}
              </span>
            </div>
            <div className="flex items-end justify-between text-accent">
              <span className="font-bold">Pay now</span>
              <span className="display text-3xl">
                {minorMoney(session.amount, session.currency)}
              </span>
            </div>
            {session.dueOnDelivery > 0 && (
              <SummaryRow
                label="Cash due on delivery"
                value={minorMoney(session.dueOnDelivery, session.currency)}
              />
            )}
          </div>
          <p className="mt-6 flex gap-2 text-xs leading-5 text-white/40">
            <ShieldCheck size={16} className="shrink-0" />
            Prices and stock were verified by DeviceDock. Card details go
            directly to Stripe.
          </p>
        </aside>
      </div>
    </div>
  );
}

function StripePaymentForm({
  paymentId,
  paymentMethod,
}: {
  paymentId: number;
  paymentMethod: "CARD" | "CASH_ON_DELIVERY";
}) {
  const stripe = useStripe();
  const elements = useElements();
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);

  const pay = async () => {
    if (!stripe || !elements) return;
    setSubmitting(true);
    const result = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: `${window.location.origin}/checkout/complete?paymentId=${paymentId}`,
      },
    });
    if (result.error) {
      const reason = result.error.message ?? "Payment could not be confirmed.";
      router.push(
        `/payment/failure?paymentId=${paymentId}&reason=${encodeURIComponent(reason)}`,
      );
    }
  };

  return (
    <div className="mt-9">
      <PaymentElement />
      <Button
        type="button"
        onClick={() => void pay()}
        loading={submitting}
        disabled={!stripe || !elements}
        className="mt-6 h-12 w-full"
      >
        {paymentMethod === "CARD" ? "Pay securely" : "Pay COD deposit"}
      </Button>
      <p className="mt-4 text-center text-xs text-black/40">
        Your card is processed securely by Stripe. The order is confirmed only
        after verified payment.
      </p>
    </div>
  );
}

function ChoiceButton({
  selected,
  onClick,
  icon,
  title,
  description,
}: {
  selected: boolean;
  onClick: () => void;
  icon: ReactNode;
  title: string;
  description: string;
}) {
  return (
    <button
      type="button"
      aria-pressed={selected}
      onClick={onClick}
      className={`flex items-start gap-3 rounded-2xl border p-4 text-left transition ${
        selected
          ? "border-accent bg-accent/5"
          : "bg-white hover:border-black/25"
      }`}
    >
      <span className={selected ? "text-accent" : "text-black/45"}>{icon}</span>
      <span>
        <span className="block text-sm font-bold">{title}</span>
        <span className="mt-1 block text-xs text-black/45">{description}</span>
      </span>
    </button>
  );
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-4">
      <span className="text-white/45">{label}</span>
      <span className="font-semibold">{value}</span>
    </div>
  );
}

function formatCouponDiscount(coupon: PublicCoupon): string {
  return coupon.type === "PERCENTAGE"
    ? `${coupon.value}% off`
    : `${minorMoney(coupon.value, "bdt")} off`;
}

function updateDeliveryDetail(
  setDetails: Dispatch<SetStateAction<DeliveryDetails>>,
  setSelectedAddressId: Dispatch<SetStateAction<number | null>>,
  field: keyof DeliveryDetails,
  value: string,
) {
  setSelectedAddressId(null);
  setDetails((current) => ({ ...current, [field]: value }));
}

function hasCompleteDeliveryDetails(details: DeliveryDetails): boolean {
  return Boolean(
    details.customerName.trim().length >= 2 &&
    details.customerEmail.includes("@") &&
    details.customerPhone.trim().length >= 7 &&
    details.deliveryAddressLine.trim().length >= 5 &&
    details.deliveryArea.trim().length >= 2 &&
    details.deliveryCity.trim().length >= 2,
  );
}

function CheckoutSkeleton() {
  return (
    <div className="mx-auto min-h-[70vh] max-w-5xl px-5 py-14" role="status">
      <div className="grid gap-6 lg:grid-cols-[1fr_22rem]">
        <div className="rounded-[2rem] border bg-white/55 p-7">
          <div className="h-4 w-28 animate-pulse rounded bg-black/[0.065]" />
          <div className="mt-5 h-10 w-2/3 animate-pulse rounded-xl bg-black/[0.065]" />
          <div className="mt-10 h-56 animate-pulse rounded-2xl bg-black/[0.065]" />
          <div className="mt-6 h-12 animate-pulse rounded-full bg-black/[0.065]" />
        </div>
        <div className="h-80 animate-pulse rounded-[2rem] bg-black/[0.065]" />
      </div>
      <span className="sr-only">Loading checkout…</span>
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
        action={
          <Link href="/cart">
            <Button>Return to cart</Button>
          </Link>
        }
      />
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

function readPaymentId(details: unknown): number | null {
  if (!details || typeof details !== "object") return null;
  const paymentId = (details as { paymentId?: unknown }).paymentId;
  return typeof paymentId === "number" && Number.isInteger(paymentId)
    ? paymentId
    : null;
}
