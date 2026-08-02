"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { ArrowUpRight, ClipboardList } from "lucide-react";
import { useState } from "react";
import { AdminOrderInvoiceButton } from "@/components/admin/admin-order-invoice-button";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { useAuth } from "@/components/auth-provider";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { Pagination } from "@/components/ui/pagination";
import { apiFetch, minorMoney } from "@/lib/api";
import type { OrderStatus, PaginatedOrders } from "@/lib/types";
import { ListSkeleton } from "@/components/ui/skeleton";

export function AdminOrders() {
  const { accessToken } = useAuth();
  const [page, setPage] = useState(1);
  const query = useQuery({
    queryKey: ["admin", "orders", page],
    queryFn: () =>
      apiFetch<PaginatedOrders>(
        `/orders/admin/list?page=${page}&limit=12`,
        {},
        accessToken,
      ),
    enabled: Boolean(accessToken),
    placeholderData: (previous) => previous,
  });

  return (
    <main>
      <AdminPageHeader
        eyebrow="Fulfilment"
        title="Orders."
        description="Track customer purchases, inspect order details and download paid invoices."
      />

      <section className="mt-6 overflow-hidden rounded-[2rem] border bg-white/55 shadow-soft">
        {query.isLoading ? (
          <ListSkeleton rows={7} />
        ) : query.isError ? (
          <EmptyState
            icon={<ClipboardList />}
            title="Orders could not be loaded"
            description={query.error.message}
          />
        ) : query.data?.data.length ? (
          <>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[900px] text-left text-sm">
                <thead className="border-b bg-black/[0.025] text-[11px] uppercase tracking-wider text-black/40">
                  <tr>
                    <th className="px-6 py-4">Order</th>
                    <th className="px-6 py-4">Customer</th>
                    <th className="px-6 py-4">Placed</th>
                    <th className="px-6 py-4">Total</th>
                    <th className="px-6 py-4">Status</th>
                    <th className="px-6 py-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {query.data.data.map((order) => (
                    <tr key={order.id} className="transition hover:bg-white/70">
                      <td className="px-6 py-5">
                        <p className="font-bold">{order.orderNumber}</p>
                        <p className="mt-1 text-xs text-black/40">
                          {order.items.length} item
                          {order.items.length === 1 ? "" : "s"}
                        </p>
                      </td>
                      <td className="px-6 py-5">
                        <p className="font-semibold">{order.customerName}</p>
                        <p className="mt-1 text-xs text-black/40">
                          {order.customerEmail}
                        </p>
                      </td>
                      <td className="px-6 py-5 text-black/55">
                        {new Date(order.createdAt).toLocaleDateString("en-BD")}
                      </td>
                      <td className="px-6 py-5 font-bold">
                        {minorMoney(order.totalAmount, order.currency)}
                      </td>
                      <td className="px-6 py-5">
                        <OrderStatusBadge status={order.status} />
                      </td>
                      <td className="px-6 py-5">
                        <div className="flex justify-end gap-2">
                          {order.status === "PAID" && (
                            <AdminOrderInvoiceButton
                              compact
                              orderId={order.id}
                              orderNumber={order.orderNumber}
                            />
                          )}
                          <Link
                            href={`/admin/orders/${order.id}`}
                            className="inline-flex h-9 items-center gap-1 rounded-full bg-ink px-3 text-xs font-bold text-white transition hover:bg-accent"
                          >
                            View <ArrowUpRight size={14} />
                          </Link>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <Pagination
              page={page}
              totalPages={query.data.meta.totalPages}
              onPageChange={setPage}
            />
          </>
        ) : (
          <EmptyState
            icon={<ClipboardList />}
            title="No orders yet"
            description="Customer checkouts will appear here."
          />
        )}
      </section>
    </main>
  );
}

export function OrderStatusBadge({ status }: { status: OrderStatus }) {
  const tone =
    status === "PAID" || status === "COD_CONFIRMED"
      ? "success"
      : status === "PAYMENT_FAILED" || status === "CANCELLED"
        ? "danger"
        : "warning";
  return <Badge tone={tone}>{status.replaceAll("_", " ")}</Badge>;
}
