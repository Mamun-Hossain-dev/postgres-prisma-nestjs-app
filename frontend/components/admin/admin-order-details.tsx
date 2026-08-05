"use client";

import Link from "next/link";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, Package, RotateCcw } from "lucide-react";
import { AdminOrderInvoiceButton } from "@/components/admin/admin-order-invoice-button";
import {
  AdminOrderDeleteButton,
  canDeleteOrder,
} from "@/components/admin/admin-order-delete-button";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import {
  canInvoiceOrder,
  OrderStatusBadge,
} from "@/components/admin/admin-orders";
import { AdminOrderStatusControl } from "@/components/admin/admin-order-status-control";
import { AdminRefundDialog } from "@/components/admin/admin-refund-dialog";
import { useAuth } from "@/components/auth-provider";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { apiFetch, minorMoney } from "@/lib/api";
import type { Order } from "@/lib/types";
import { DetailPageSkeleton } from "@/components/ui/skeleton";

export function AdminOrderDetails({ orderId }: { orderId: number }) {
  const { accessToken } = useAuth();
  const [refundOpen, setRefundOpen] = useState(false);
  const query = useQuery({
    queryKey: ["admin", "orders", orderId],
    queryFn: () => apiFetch<Order>(`/orders/admin/${orderId}`, {}, accessToken),
    enabled: Boolean(accessToken),
  });

  if (query.isLoading) {
    return (
      <div className="pt-8">
        <DetailPageSkeleton />
      </div>
    );
  }
  if (query.isError || !query.data) {
    return (
      <EmptyState
        icon={<Package />}
        title="Order could not be loaded"
        description={query.error?.message ?? "Order not found"}
      />
    );
  }

  const order = query.data;
  return (
    <main>
      <Link
        href="/admin/orders"
        className="mb-5 inline-flex items-center gap-2 text-sm font-bold text-black/50 hover:text-ink"
      >
        <ArrowLeft size={16} /> Back to orders
      </Link>
      <AdminPageHeader
        eyebrow="Order details"
        title={order.orderNumber}
        description={`Placed ${new Date(order.createdAt).toLocaleString("en-BD")}`}
        action={
          canInvoiceOrder(order.status) || canDeleteOrder(order.status) ? (
            <div className="flex flex-wrap gap-3">
              {canInvoiceOrder(order.status) && (
                <AdminOrderInvoiceButton
                  orderId={order.id}
                  orderNumber={order.orderNumber}
                />
              )}
              {canDeleteOrder(order.status) && (
                <AdminOrderDeleteButton
                  orderId={order.id}
                  orderNumber={order.orderNumber}
                  redirectAfterDelete
                />
              )}
            </div>
          ) : undefined
        }
      />

      <div className="mt-6 grid gap-5 xl:grid-cols-[1fr_340px]">
        <section className="overflow-hidden rounded-[2rem] border bg-white/55 shadow-soft">
          <div className="border-b px-6 py-5">
            <h2 className="display text-2xl">Purchased products</h2>
          </div>
          <div className="divide-y px-6">
            {order.items.map((item) => (
              <div
                key={item.id}
                className="flex items-start justify-between gap-5 py-5"
              >
                <div>
                  <p className="font-bold">{item.productTitle}</p>
                  <p className="mt-1 text-xs text-black/40">
                    {item.productSku} · Qty {item.quantity}
                  </p>
                </div>
                <p className="font-bold">
                  {minorMoney(item.totalAmount, order.currency)}
                </p>
              </div>
            ))}
          </div>
          <div className="space-y-3 border-t bg-white/45 px-6 py-5 text-sm">
            <div className="flex justify-between">
              <span>Products</span>
              <span>{minorMoney(order.subtotalAmount, order.currency)}</span>
            </div>
            <div className="flex justify-between">
              <span>Delivery</span>
              <span>{minorMoney(order.deliveryCharge, order.currency)}</span>
            </div>
            {order.discountAmount > 0 && (
              <div className="flex justify-between text-emerald-700">
                <span>Coupon {order.couponCode}</span>
                <span>-{minorMoney(order.discountAmount, order.currency)}</span>
              </div>
            )}
            <div className="flex justify-between text-lg font-bold">
              <span>Total</span>
              <span>{minorMoney(order.totalAmount, order.currency)}</span>
            </div>
          </div>
        </section>

        <aside className="h-fit rounded-[2rem] bg-ink p-7 text-white shadow-soft">
          <OrderStatusBadge status={order.status} />
          <h2 className="display mt-8 text-2xl">Customer</h2>
          <p className="mt-4 font-bold">{order.customerName}</p>
          <p className="mt-1 break-all text-sm text-white/55">
            {order.customerEmail}
          </p>
          <p className="mt-1 text-sm text-white/55">{order.customerPhone}</p>
          <p className="mt-4 text-sm leading-6 text-white/70">
            {order.deliveryAddressLine}, {order.deliveryArea},{" "}
            {order.deliveryCity}
            {order.deliveryPostalCode ? ` ${order.deliveryPostalCode}` : ""}
          </p>
          <dl className="mt-8 space-y-4 border-t border-white/10 pt-6 text-sm">
            <div className="flex justify-between gap-4">
              <dt className="text-white/45">Order ID</dt>
              <dd>#{order.id}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-white/45">Customer ID</dt>
              <dd>#{order.userId}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-white/45">Payment</dt>
              <dd className="text-right">
                {order.paymentMethod === "CARD" ? "Card" : "Cash on delivery"}
              </dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-white/45">Delivery area</dt>
              <dd className="text-right">
                {order.deliveryZone === "DHAKA"
                  ? "Inside Dhaka"
                  : "Outside Dhaka"}
              </dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-white/45">Fully paid at</dt>
              <dd className="text-right">
                {order.paidAt
                  ? new Date(order.paidAt).toLocaleString("en-BD")
                  : "Not paid"}
              </dd>
            </div>
          </dl>
          <div className="mt-8 border-t border-white/10 pt-6">
            <p className="mb-3 text-xs font-bold uppercase tracking-wider text-white/40">
              Fulfilment
            </p>
            <AdminOrderStatusControl order={order} />
          </div>
          {canRefundOrder(order) && (
            <div className="mt-8 border-t border-white/10 pt-6">
              <p className="mb-3 text-xs font-bold uppercase tracking-wider text-white/40">
                Refund
              </p>
              <dl className="mb-4 space-y-2 text-sm">
                <div className="flex justify-between gap-4">
                  <dt className="text-white/45">Payment ID</dt>
                  <dd>#{order.payments?.[0]?.id}</dd>
                </div>
                <div className="flex justify-between gap-4">
                  <dt className="text-white/45">Paid</dt>
                  <dd>
                    {minorMoney(order.payments?.[0]?.amount ?? 0, order.currency)}
                  </dd>
                </div>
              </dl>
              <Button
                className="w-full"
                variant="secondary"
                onClick={() => setRefundOpen(true)}
              >
                <RotateCcw size={16} /> Request refund
              </Button>
            </div>
          )}
        </aside>
      </div>

      <AdminRefundDialog
        open={refundOpen}
        onOpenChange={setRefundOpen}
        paymentId={order.payments?.[0]?.id}
        paymentAmount={order.payments?.[0]?.amount}
        currency={order.currency}
      />
    </main>
  );
}

export function canRefundOrder(order: Order): boolean {
  return Boolean(order.payments?.some((payment) => payment.status === "SUCCEEDED"));
}
