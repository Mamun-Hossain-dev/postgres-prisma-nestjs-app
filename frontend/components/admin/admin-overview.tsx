"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import {
  ArrowRight,
  ClipboardList,
  CreditCard,
  ShoppingBag,
  TrendingUp,
  UsersRound,
  Wallet,
} from "lucide-react";
import { useAuth } from "@/components/auth-provider";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { AdminOrderInvoiceButton } from "@/components/admin/admin-order-invoice-button";
import { AdminOrderResendButton } from "@/components/admin/admin-order-resend-button";
import { OrderStatusBadge } from "@/components/admin/admin-orders";
import { apiFetch, minorMoney } from "@/lib/api";
import type {
  AnalyticsOverview,
  OrderStatus,
  PaginatedOrders,
  PaginatedProducts,
} from "@/lib/types";
import { ListSkeleton, Skeleton } from "@/components/ui/skeleton";

export function AdminOverview() {
  const { accessToken, user } = useAuth();
  const analytics = useQuery({
    queryKey: ["admin", "analytics"],
    queryFn: () =>
      apiFetch<AnalyticsOverview>("/operations/analytics", {}, accessToken),
    enabled: Boolean(accessToken),
  });
  const orders = useQuery({
    queryKey: ["admin", "orders", "overview"],
    queryFn: () =>
      apiFetch<PaginatedOrders>(
        "/orders/admin/list?page=1&limit=5",
        {},
        accessToken,
      ),
    enabled: Boolean(accessToken),
  });
  const products = useQuery({
    queryKey: ["admin", "products", "overview"],
    queryFn: () =>
      apiFetch<PaginatedProducts>(
        "/products/admin/list?page=1&limit=100",
        {},
        accessToken,
      ),
    enabled: Boolean(accessToken),
  });

  const data = analytics.data;
  const productList = products.data?.data ?? [];

  return (
    <main>
      <AdminPageHeader
        eyebrow="Live operations"
        title={`Good day, ${user?.name.split(" ")[0]}.`}
        action={
          <span className="inline-flex w-fit items-center gap-2 rounded-full border bg-white/55 px-4 py-2 text-xs font-bold">
            <span className="h-2 w-2 rounded-full bg-emerald-500" /> Systems
            online
          </span>
        }
      />

      <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Metric
          icon={<Wallet />}
          label="Total revenue"
          value={minorMoney(data?.revenue.total ?? 0, "bdt")}
          loading={analytics.isLoading}
        />
        <Metric
          icon={<TrendingUp />}
          label="Revenue today"
          value={minorMoney(data?.revenue.today ?? 0, "bdt")}
          loading={analytics.isLoading}
        />
        <Metric
          icon={<ClipboardList />}
          label="Orders"
          value={String(data?.orders.total ?? 0)}
          hint={`${data?.orders.pendingFulfilment ?? 0} awaiting fulfilment`}
          loading={analytics.isLoading}
        />
        <Metric
          icon={<UsersRound />}
          label="Customers"
          value={String(data?.customers.total ?? 0)}
          hint={`+${data?.customers.newLast30Days ?? 0} new this month`}
          loading={analytics.isLoading}
        />
      </div>

      <section className="mt-6 overflow-hidden rounded-[2rem] border bg-white/55 shadow-soft">
        <div className="flex items-end justify-between gap-5 border-b p-6 sm:px-8">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-accent">
              Sales analytics
            </p>
            <h2 className="display mt-2 text-2xl md:text-3xl">
              Revenue, last 14 days.
            </h2>
          </div>
          <div className="text-right">
            <p className="display text-xl font-medium">
              {minorMoney(data?.revenue.last30Days ?? 0, "bdt")}
            </p>
            <p className="text-[11px] font-semibold text-black/40">
              Last 30 days
            </p>
          </div>
        </div>
        <div className="p-6 sm:px-8">
          {analytics.isLoading ? (
            <Skeleton className="h-44 w-full" />
          ) : data?.salesTrend.length ? (
            <SalesTrendChart trend={data.salesTrend} />
          ) : (
            <p className="py-10 text-center text-sm text-black/45">
              No sales in the last 14 days yet.
            </p>
          )}
        </div>
      </section>

      <div className="mt-6 grid gap-5 xl:grid-cols-2">
        <section className="overflow-hidden rounded-[2rem] border bg-white/55 shadow-soft">
          <div className="border-b p-6 sm:px-8">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-accent">
              Order pipeline
            </p>
            <h2 className="display mt-2 text-2xl">Status breakdown.</h2>
          </div>
          <div className="space-y-4 p-6 sm:px-8">
            {analytics.isLoading
              ? Array.from({ length: 5 }).map((_, index) => (
                  <Skeleton key={index} className="h-6 w-full" />
                ))
              : orderStatusRows(data?.orders.byStatus).map(
                  ({ status, count, share }) => (
                    <div key={status}>
                      <div className="flex items-center justify-between gap-4 text-sm">
                        <OrderStatusBadge status={status as OrderStatus} />
                        <span className="font-bold">{count}</span>
                      </div>
                      <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-black/5">
                        <div
                          className="h-full rounded-full bg-accent"
                          style={{ width: `${share}%` }}
                        />
                      </div>
                    </div>
                  ),
                )}
            {!analytics.isLoading &&
              !orderStatusRows(data?.orders.byStatus).length && (
                <p className="py-6 text-sm text-black/45">No orders yet.</p>
              )}
          </div>
        </section>

        <section className="overflow-hidden rounded-[2rem] border bg-white/55 shadow-soft">
          <div className="border-b p-6 sm:px-8">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-accent">
              Payment mix
            </p>
            <h2 className="display mt-2 text-2xl">How orders are paid.</h2>
          </div>
          <div className="grid gap-4 p-6 sm:grid-cols-2 sm:px-8">
            <PaymentSplitCard
              label="Card payments"
              count={data?.paymentSplit.CARD.count ?? 0}
              amount={data?.paymentSplit.CARD.amount ?? 0}
              icon={<CreditCard />}
              loading={analytics.isLoading}
            />
            <PaymentSplitCard
              label="Cash on delivery"
              count={data?.paymentSplit.CASH_ON_DELIVERY.count ?? 0}
              amount={data?.paymentSplit.CASH_ON_DELIVERY.amount ?? 0}
              icon={<ShoppingBag />}
              loading={analytics.isLoading}
            />
          </div>
          <div className="border-t p-6 sm:px-8">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-accent">
              Average order value
            </p>
            <p className="display mt-2 text-3xl">
              {minorMoney(data?.revenue.averageOrderValue ?? 0, "bdt")}
            </p>
          </div>
        </section>
      </div>

      <div className="mt-6 grid gap-5 xl:grid-cols-2">
        <section className="overflow-hidden rounded-[2rem] border bg-white/55 shadow-soft">
          <div className="flex items-end justify-between gap-5 border-b p-6 sm:px-8">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-accent">
                Best sellers
              </p>
              <h2 className="display mt-2 text-2xl">Top products.</h2>
            </div>
            <Link
              href="/admin/products"
              className="flex items-center gap-2 text-sm font-bold"
            >
              View all <ArrowRight size={16} />
            </Link>
          </div>
          <div className="divide-y">
            {analytics.isLoading
              ? Array.from({ length: 5 }).map((_, index) => (
                  <div key={index} className="flex justify-between p-5 sm:px-8">
                    <Skeleton className="h-4 w-40" />
                    <Skeleton className="h-4 w-24" />
                  </div>
                ))
              : data?.topProducts.length ? (
                  data.topProducts.map((product, index) => (
                    <div
                      key={`${product.sku}-${product.productId}`}
                      className="flex items-center justify-between gap-4 p-5 sm:px-8"
                    >
                      <div className="flex min-w-0 items-center gap-4">
                        <span className="text-xs font-extrabold text-black/20">
                          0{index + 1}
                        </span>
                        <div className="min-w-0">
                          <p className="truncate font-bold">{product.title}</p>
                          <p className="mt-1 text-xs text-black/40">
                            {product.sku} · {product.unitsSold} sold
                          </p>
                        </div>
                      </div>
                      <p className="shrink-0 font-bold">
                        {minorMoney(product.revenue, "bdt")}
                      </p>
                    </div>
                  ))
                ) : (
                  <p className="p-8 text-sm text-black/45">
                    No confirmed orders yet.
                  </p>
                )}
          </div>
        </section>

        <section className="overflow-hidden rounded-[2rem] border bg-white/55 shadow-soft">
          <div className="flex items-end justify-between gap-5 border-b p-6 sm:px-8">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-accent">
                Recent sales
              </p>
              <h2 className="display mt-2 text-2xl">Latest orders.</h2>
            </div>
            <Link
              href="/admin/orders"
              className="flex items-center gap-2 text-sm font-bold"
            >
              View all <ArrowRight size={16} />
            </Link>
          </div>
          <div className="divide-y">
            {orders.isLoading ? (
              <ListSkeleton rows={5} />
            ) : orders.data?.data.length ? (
              orders.data.data.map((order) => (
                <div
                  key={order.id}
                  className="grid gap-4 p-5 sm:grid-cols-[1fr_1fr_auto] sm:items-center sm:px-8"
                >
                  <Link href={`/admin/orders/${order.id}`}>
                    <p className="font-bold hover:text-accent">
                      {order.orderNumber}
                    </p>
                    <p className="mt-1 text-xs text-black/40">
                      {order.customerName}
                    </p>
                  </Link>
                  <div>
                    <OrderStatusBadge status={order.status} />
                    <p className="mt-2 text-sm font-bold">
                      {minorMoney(order.totalAmount, order.currency)}
                    </p>
                  </div>
                  <div className="flex items-center justify-end gap-2">
                    {canResendOrder(order.status) && (
                      <AdminOrderResendButton
                        compact
                        orderId={order.id}
                        orderNumber={order.orderNumber}
                      />
                    )}
                    <AdminOrderInvoiceButton
                      compact
                      orderId={order.id}
                      orderNumber={order.orderNumber}
                    />
                    <Link
                      href={`/admin/orders/${order.id}`}
                      className="inline-flex h-9 items-center rounded-full bg-ink px-4 text-xs font-bold text-white hover:bg-accent"
                    >
                      View
                    </Link>
                  </div>
                </div>
              ))
            ) : (
              <p className="p-8 text-sm text-black/45">No orders yet.</p>
            )}
          </div>
        </section>
      </div>

      <section className="mt-6 rounded-[2rem] bg-ink p-7 text-white sm:p-9">
        <div className="flex items-end justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-white/40">
              Catalog pulse
            </p>
            <h2 className="display mt-2 text-2xl font-medium md:text-3xl">
              Products needing attention.
            </h2>
          </div>
          <Link
            href="/admin/inventory"
            className="hidden items-center gap-2 text-sm font-bold sm:flex"
          >
            Open inventory <ArrowRight size={16} />
          </Link>
        </div>
        <div className="mt-8 divide-y divide-white/10">
          {products.isLoading
            ? Array.from({ length: 5 }).map((_, index) => (
                <div key={index} className="flex justify-between py-4">
                  <div className="flex-1">
                    <Skeleton className="h-4 w-2/5 bg-white/10" />
                    <Skeleton className="mt-2 h-3 w-1/4 bg-white/10" />
                  </div>
                  <Skeleton className="h-4 w-20 bg-white/10" />
                </div>
              ))
            : productList.slice(0, 5).map((product) => (
                <Link
                  href={`/admin/inventory`}
                  key={product.id}
                  prefetch={false}
                  className="grid grid-cols-[1fr_auto] gap-5 py-4"
                >
                  <div>
                    <p className="font-semibold">{product.title}</p>
                    <p className="mt-1 text-xs text-white/40">
                      {product.brand} · {product.category}
                    </p>
                  </div>
                  <p
                    className={
                      product.quantity < 5 ? "text-accent" : "text-white/65"
                    }
                  >
                    {product.quantity} in stock
                  </p>
                </Link>
              ))}
        </div>
      </section>
    </main>
  );
}

function orderStatusRows(byStatus?: Record<OrderStatus, number>) {
  if (!byStatus) return [];
  const total = Object.values(byStatus).reduce((sum, count) => sum + count, 0);
  return Object.entries(byStatus)
    .filter(([, count]) => count > 0)
    .sort((a, b) => b[1] - a[1])
    .map(([status, count]) => ({
      status,
      count,
      share: total ? Math.max((count / total) * 100, 2) : 0,
    }));
}

function canResendOrder(status: OrderStatus): boolean {
  return [
    "PAID",
    "COD_CONFIRMED",
    "PROCESSING",
    "SHIPPED",
    "DELIVERED",
  ].includes(status);
}

function SalesTrendChart({ trend }: { trend: AnalyticsOverview["salesTrend"] }) {
  const max = Math.max(...trend.map((day) => day.revenue), 1);
  return (
    <div>
      <div className="flex h-40 items-end gap-1.5">
        {trend.map((day, index) => (
          <div
            key={day.date}
            className="group relative flex h-full flex-1 items-end"
          >
            <div className="absolute -top-9 left-1/2 z-10 -translate-x-1/2 whitespace-nowrap rounded-lg bg-ink px-2 py-1 text-[10px] font-bold text-white opacity-0 shadow-lg transition group-hover:opacity-100">
              {minorMoney(day.revenue, "bdt")} · {day.orders} order
              {day.orders === 1 ? "" : "s"}
            </div>
            <div
              className={`w-full rounded-t-md transition ${
                day.revenue > 0
                  ? "bg-accent/80 group-hover:bg-accent"
                  : "bg-black/[0.06]"
              }`}
              style={{
                height: day.revenue > 0 ? `${(day.revenue / max) * 100}%` : "3px",
              }}
            />
          </div>
        ))}
      </div>
      <div className="mt-2 flex gap-1.5">
        {trend.map((day, index) => (
          <p
            key={day.date}
            className={`flex-1 text-center text-[10px] font-semibold text-black/40 ${
              index % 2 === 1 ? "sm:text-transparent" : ""
            }`}
          >
            {new Date(day.date).toLocaleDateString("en-BD", {
              day: "numeric",
              month: "short",
            })}
          </p>
        ))}
      </div>
    </div>
  );
}

function Metric({
  icon,
  label,
  value,
  hint,
  loading = false,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  hint?: string;
  loading?: boolean;
}) {
  return (
    <div className="rounded-[1.75rem] border bg-white/55 p-6 shadow-soft">
      <span className="text-accent">{icon}</span>
      <p className="mt-8 text-xs font-bold uppercase tracking-wider text-black/40">
        {label}
      </p>
      {loading ? (
        <Skeleton className="mt-2 h-8 w-24" />
      ) : (
        <>
          <p className="display mt-1 text-3xl">{value}</p>
          {hint && <p className="mt-1 text-[11px] font-semibold text-black/40">{hint}</p>}
        </>
      )}
    </div>
  );
}

function PaymentSplitCard({
  label,
  count,
  amount,
  icon,
  loading,
}: {
  label: string;
  count: number;
  amount: number;
  icon: React.ReactNode;
  loading: boolean;
}) {
  return (
    <div className="rounded-[1.5rem] border bg-white/60 p-5">
      <div className="flex items-center justify-between text-black/40">
        <span className="text-xs font-bold uppercase">{label}</span>
        {icon}
      </div>
      {loading ? (
        <Skeleton className="mt-4 h-8 w-24" />
      ) : (
        <>
          <p className="display mt-4 text-3xl">{minorMoney(amount, "bdt")}</p>
          <p className="mt-1 text-xs font-semibold text-black/45">
            {count} order{count === 1 ? "" : "s"}
          </p>
        </>
      )}
    </div>
  );
}
