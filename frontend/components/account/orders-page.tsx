"use client";

import { useMutation, useQuery } from "@tanstack/react-query";
import { Download, Package } from "lucide-react";
import { toast } from "sonner";
import { AccountShell } from "@/components/account-shell";
import { useAuth } from "@/components/auth-provider";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { apiFetch, apiFetchBlob, minorMoney } from "@/lib/api";
import type { PaginatedOrders } from "@/lib/types";
import { Skeleton } from "@/components/ui/skeleton";

export function OrdersPage() {
  const { accessToken } = useAuth();
  const orders = useQuery({
    queryKey: ["orders"],
    queryFn: () =>
      apiFetch<PaginatedOrders>("/orders?page=1&limit=50", {}, accessToken),
    enabled: Boolean(accessToken),
  });
  const invoice = useMutation({
    mutationFn: async ({
      orderId,
      orderNumber,
    }: {
      orderId: number;
      orderNumber: string;
    }) => ({
      blob: await apiFetchBlob(`/orders/${orderId}/invoice`, accessToken),
      orderNumber,
    }),
    onSuccess: ({ blob, orderNumber }) => {
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = `devicedock-${orderNumber}.pdf`;
      anchor.click();
      URL.revokeObjectURL(url);
    },
    onError: (error: Error) => toast.error(error.message),
  });

  return (
    <AccountShell active="orders">
      <section>
        <p className="text-xs font-bold uppercase tracking-[0.22em] text-accent">
          Purchase history
        </p>
        <h1 className="display mt-2 text-5xl sm:text-6xl">Your orders.</h1>
        {orders.isLoading ? (
          <div className="mt-8 grid gap-5" role="status">
            {Array.from({ length: 3 }).map((_, index) => (
              <div
                key={index}
                className="rounded-[2rem] border bg-white/55 p-6 shadow-soft"
              >
                <div className="flex justify-between gap-5">
                  <div className="flex-1">
                    <Skeleton className="h-5 w-36" />
                    <Skeleton className="mt-3 h-3 w-48" />
                  </div>
                  <Skeleton className="h-7 w-24 rounded-full" />
                </div>
                <Skeleton className="mt-7 h-16 w-full rounded-2xl" />
              </div>
            ))}
            <span className="sr-only">Loading orders…</span>
          </div>
        ) : orders.isError ? (
          <div className="mt-8">
            <EmptyState
              icon={<Package />}
              title="Orders could not be loaded"
              description={orders.error.message}
              action={
                <Button onClick={() => void orders.refetch()}>Try again</Button>
              }
            />
          </div>
        ) : orders.data?.data.length ? (
          <div className="mt-8 grid gap-5">
            {orders.data.data.map((order) => (
              <article
                key={order.id}
                className="overflow-hidden rounded-[2rem] border bg-white/55 shadow-soft"
              >
                <div className="flex flex-wrap items-start justify-between gap-4 border-b p-6">
                  <div>
                    <p className="font-bold">{order.orderNumber}</p>
                    <p className="mt-1 text-xs text-black/40">
                      {new Date(order.createdAt).toLocaleString()}
                    </p>
                  </div>
                  <div className="text-right">
                    <Badge
                      tone={
                        order.status === "PAID" ||
                        order.status === "COD_CONFIRMED"
                          ? "success"
                          : order.status === "PAYMENT_FAILED" ||
                              order.status === "CANCELLED"
                            ? "danger"
                            : "warning"
                      }
                    >
                      {order.status.replaceAll("_", " ")}
                    </Badge>
                    <p className="mt-2 font-bold">
                      {minorMoney(order.totalAmount, order.currency)}
                    </p>
                    <p className="mt-1 text-xs text-black/40">
                      {order.paymentMethod === "CARD"
                        ? "Paid by card"
                        : `${minorMoney(order.subtotalAmount - order.discountAmount, order.currency)} due on delivery`}
                    </p>
                  </div>
                </div>
                <div className="divide-y px-6">
                  {order.items.map((item) => (
                    <div
                      key={item.id}
                      className="flex justify-between gap-5 py-4 text-sm"
                    >
                      <div>
                        <p className="font-semibold">{item.productTitle}</p>
                        <p className="mt-1 text-xs text-black/40">
                          {item.productSku} · Qty {item.quantity}
                        </p>
                      </div>
                      <p className="font-semibold">
                        {minorMoney(item.totalAmount, order.currency)}
                      </p>
                    </div>
                  ))}
                </div>
                {order.status === "PAID" && (
                  <div className="border-t p-5 text-right">
                    <Button
                      variant="outline"
                      loading={
                        invoice.isPending &&
                        invoice.variables?.orderId === order.id
                      }
                      onClick={() =>
                        invoice.mutate({
                          orderId: order.id,
                          orderNumber: order.orderNumber,
                        })
                      }
                    >
                      <Download size={16} /> Download invoice
                    </Button>
                  </div>
                )}
              </article>
            ))}
          </div>
        ) : (
          <div className="mt-8">
            <EmptyState
              icon={<Package />}
              title="No orders yet"
              description="Completed checkouts will appear here."
            />
          </div>
        )}
      </section>
    </AccountShell>
  );
}
