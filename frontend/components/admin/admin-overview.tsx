"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import {
  ArrowRight,
  Boxes,
  ClipboardList,
  ShieldCheck,
  UsersRound,
} from "lucide-react";
import { useAuth } from "@/components/auth-provider";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { AdminOrderInvoiceButton } from "@/components/admin/admin-order-invoice-button";
import { OrderStatusBadge } from "@/components/admin/admin-orders";
import { apiFetch, minorMoney, money } from "@/lib/api";
import type {
  PaginatedOrders,
  PaginatedProducts,
  PaginatedUsers,
} from "@/lib/types";
import { ListSkeleton, Skeleton } from "@/components/ui/skeleton";

export function AdminOverview() {
  const { accessToken, user } = useAuth();
  const users = useQuery({
    queryKey: ["admin", "users"],
    queryFn: () =>
      apiFetch<PaginatedUsers>(
        "/users?page=1&limit=100&role=USER",
        {},
        accessToken,
      ),
    enabled: !!accessToken,
  });
  const products = useQuery({
    queryKey: ["admin", "products"],
    queryFn: () =>
      apiFetch<PaginatedProducts>(
        "/products/admin/list?page=1&limit=100",
        {},
        accessToken,
      ),
    enabled: !!accessToken,
  });
  const orders = useQuery({
    queryKey: ["admin", "orders", "overview"],
    queryFn: () =>
      apiFetch<PaginatedOrders>(
        "/orders/admin/list?page=1&limit=5",
        {},
        accessToken,
      ),
    enabled: !!accessToken,
  });
  const productList = products.data?.data ?? [];
  const inventoryValue = productList.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0,
  );

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
          icon={<UsersRound />}
          label="Customers"
          value={String(users.data?.meta.totalItems ?? 0)}
          loading={users.isLoading}
        />
        <Metric
          icon={<Boxes />}
          label="Products"
          value={String(products.data?.meta.totalItems ?? 0)}
          loading={products.isLoading}
        />
        <Metric
          icon={<ClipboardList />}
          label="Orders"
          value={String(orders.data?.meta.totalItems ?? 0)}
          loading={orders.isLoading}
        />
        <Metric
          icon={<ShieldCheck />}
          label="Inventory value"
          value={money(inventoryValue)}
          loading={products.isLoading}
        />
      </div>
      <section className="mt-6 overflow-hidden rounded-[2rem] border bg-white/55 shadow-soft">
        <div className="flex items-end justify-between gap-5 border-b p-6 sm:px-8">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-accent">
              Recent sales
            </p>
            <h2 className="display mt-2 text-2xl md:text-3xl">
              Latest orders.
            </h2>
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
          ) : (
            orders.data?.data.map((order) => (
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
                <div className="flex items-center gap-2">
                  {order.status === "PAID" && (
                    <AdminOrderInvoiceButton
                      compact
                      orderId={order.id}
                      orderNumber={order.orderNumber}
                    />
                  )}
                  <Link
                    href={`/admin/orders/${order.id}`}
                    className="inline-flex h-9 items-center rounded-full bg-ink px-4 text-xs font-bold text-white hover:bg-accent"
                  >
                    View
                  </Link>
                </div>
              </div>
            ))
          )}
          {!orders.isLoading && !orders.data?.data.length && (
            <p className="p-8 text-sm text-black/45">No orders yet.</p>
          )}
        </div>
      </section>
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
            href="/admin/products"
            className="hidden items-center gap-2 text-sm font-bold sm:flex"
          >
            View catalog <ArrowRight size={16} />
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
                  href={`/products/${product.id}`}
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

function Metric({
  icon,
  label,
  value,
  loading = false,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
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
        <p className="display mt-1 text-3xl">{value}</p>
      )}
    </div>
  );
}
