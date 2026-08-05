"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Plus, RotateCcw } from "lucide-react";
import {
  AdminOrderInvoiceButton,
} from "@/components/admin/admin-order-invoice-button";
import {
  canInvoiceOrder,
} from "@/components/admin/admin-orders";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { AdminRefundDialog } from "@/components/admin/admin-refund-dialog";
import { useAuth } from "@/components/auth-provider";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Pagination } from "@/components/ui/pagination";
import { apiFetch, minorMoney } from "@/lib/api";
import type { PaginatedRefunds, RefundStatus } from "@/lib/types";
import { ListSkeleton } from "@/components/ui/skeleton";

const statusTabs: Array<{ value: "all" | RefundStatus; label: string }> = [
  { value: "all", label: "All" },
  { value: "PENDING", label: "Pending" },
  { value: "SUCCEEDED", label: "Succeeded" },
  { value: "FAILED", label: "Failed" },
];

export function AdminRefunds() {
  const { accessToken } = useAuth();
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState<"all" | RefundStatus>("all");
  const [creating, setCreating] = useState(false);

  const params = new URLSearchParams({ page: String(page), limit: "12" });
  if (status !== "all") params.set("status", status);

  const query = useQuery({
    queryKey: ["admin", "refunds", params.toString()],
    queryFn: () =>
      apiFetch<PaginatedRefunds>(`/refunds?${params}`, {}, accessToken),
    enabled: Boolean(accessToken),
    placeholderData: (previous) => previous,
  });

  const refunds = query.data?.data ?? [];

  return (
    <section>
      <AdminPageHeader
        eyebrow="Payments"
        title="Refunds."
        description="Request refunds against captured payments and track them until they settle."
        action={
          <Button className="h-12" onClick={() => setCreating(true)}>
            <Plus size={17} /> New refund
          </Button>
        }
      />

      <div className="mt-6 overflow-hidden rounded-[2rem] border bg-white/55 shadow-soft">
        <div className="flex gap-1 border-b p-4">
          {statusTabs.map((tab) => (
            <button
              key={tab.value}
              type="button"
              onClick={() => {
                setStatus(tab.value);
                setPage(1);
              }}
              className={`rounded-full px-4 py-2 text-xs font-bold transition ${
                status === tab.value
                  ? "bg-ink text-white"
                  : "text-black/55 hover:text-ink"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {query.isLoading ? (
          <ListSkeleton rows={7} />
        ) : query.isError ? (
          <EmptyState
            icon={<RotateCcw />}
            title="Refunds could not be loaded"
            description={query.error.message}
            action={
              <Button onClick={() => void query.refetch()}>Try again</Button>
            }
          />
        ) : refunds.length === 0 ? (
          <EmptyState
            icon={<RotateCcw />}
            title={status === "all" ? "No refunds yet" : `No ${status.toLowerCase()} refunds`}
            description="Request a refund from an order or use the New refund button above."
            action={
              <Button onClick={() => setCreating(true)}>
                <Plus size={17} /> Request a refund
              </Button>
            }
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[980px] text-left text-sm">
              <thead className="border-b bg-black/[0.025] text-[11px] uppercase tracking-wider text-black/40">
                <tr>
                  <th className="px-6 py-4">Refund</th>
                  <th className="px-6 py-4">Order</th>
                  <th className="px-6 py-4">Customer</th>
                  <th className="px-6 py-4">Amount</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4">Requested</th>
                  <th className="px-6 py-4 text-right">Invoice</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {refunds.map((refund) => (
                  <tr
                    key={refund.id}
                    className="transition hover:bg-white/70"
                  >
                    <td className="px-6 py-5">
                      <p className="font-bold">#{refund.id}</p>
                      <p className="mt-1 text-xs text-black/40">
                        Payment #{refund.paymentId}
                      </p>
                    </td>
                    <td className="px-6 py-5">
                      <p className="font-semibold">
                        {refund.payment.order.orderNumber}
                      </p>
                      <p className="mt-1 text-xs text-black/40">
                        {refund.payment.order.paymentMethod === "CARD"
                          ? "Card"
                          : "Cash on delivery"}
                      </p>
                    </td>
                    <td className="px-6 py-5">
                      <p className="font-semibold">
                        {refund.payment.order.customerName}
                      </p>
                      <p className="mt-1 text-xs text-black/40">
                        {refund.payment.order.customerEmail}
                      </p>
                    </td>
                    <td className="px-6 py-5 font-bold">
                      {minorMoney(refund.amount, refund.currency)}
                    </td>
                    <td className="px-6 py-5">
                      <RefundStatusBadge status={refund.status} />
                      {refund.status === "FAILED" && refund.failureMessage && (
                        <p className="mt-1 max-w-[220px] text-xs text-red-600">
                          {refund.failureMessage}
                        </p>
                      )}
                    </td>
                    <td className="px-6 py-5 text-black/55">
                      <p>{new Date(refund.createdAt).toLocaleDateString("en-BD")}</p>
                      {refund.completedAt && (
                        <p className="mt-1 text-xs text-black/40">
                          {new Date(refund.completedAt).toLocaleString("en-BD")}
                        </p>
                      )}
                    </td>
                    <td className="px-6 py-5">
                      <div className="flex justify-end">
                        {canInvoiceOrder(refund.payment.order.status) && (
                          <AdminOrderInvoiceButton
                            compact
                            orderId={refund.payment.order.id}
                            orderNumber={refund.payment.order.orderNumber}
                          />
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {query.data && (
          <Pagination
            page={page}
            totalPages={query.data.meta.totalPages}
            onPageChange={setPage}
          />
        )}
      </div>

      <AdminRefundDialog
        open={creating}
        onOpenChange={setCreating}
        paymentId={null}
      />
    </section>
  );
}

export function RefundStatusBadge({ status }: { status: RefundStatus }) {
  const tone =
    status === "SUCCEEDED"
      ? "success"
      : status === "FAILED"
        ? "danger"
        : "warning";
  return <Badge tone={tone}>{status.replaceAll("_", " ")}</Badge>;
}
