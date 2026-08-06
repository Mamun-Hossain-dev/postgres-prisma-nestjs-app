"use client";

import { useEffect, useState } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { CheckCircle2, Undo2, X, XCircle } from "lucide-react";
import { toast } from "sonner";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { useAuth } from "@/components/auth-provider";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Field, Input } from "@/components/ui/field";
import { Textarea } from "@/components/ui/textarea";
import { Pagination } from "@/components/ui/pagination";
import { apiFetch, minorMoney } from "@/lib/api";
import type {
  PaginatedRefundRequests,
  RefundRequest,
  RefundRequestStatus,
} from "@/lib/types";
import { ListSkeleton } from "@/components/ui/skeleton";

const statusTabs: Array<{
  value: "all" | RefundRequestStatus;
  label: string;
}> = [
  { value: "all", label: "All" },
  { value: "PENDING", label: "Pending" },
  { value: "APPROVED", label: "Approved" },
  { value: "DENIED", label: "Denied" },
];

export function AdminRefundRequests() {
  const { accessToken } = useAuth();
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState<"all" | RefundRequestStatus>("all");
  const [decision, setDecision] = useState<{
    request: RefundRequest;
    action: "approve" | "deny";
  } | null>(null);

  const params = new URLSearchParams({ page: String(page), limit: "12" });
  if (status !== "all") params.set("status", status);

  const query = useQuery({
    queryKey: ["admin", "refund-requests", params.toString()],
    queryFn: () =>
      apiFetch<PaginatedRefundRequests>(
        `/refund-requests/admin?${params}`,
        {},
        accessToken,
      ),
    enabled: Boolean(accessToken),
    placeholderData: (previous) => previous,
  });

  const requests = query.data?.data ?? [];

  return (
    <section>
      <AdminPageHeader
        eyebrow="Payments"
        title="Refund requests."
        description="Review refunds requested by customers and approve or deny them."
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
            icon={<Undo2 />}
            title="Refund requests could not be loaded"
            description={query.error.message}
            action={
              <Button onClick={() => void query.refetch()}>Try again</Button>
            }
          />
        ) : requests.length === 0 ? (
          <EmptyState
            icon={<Undo2 />}
            title={
              status === "all"
                ? "No refund requests yet"
                : `No ${status.toLowerCase()} refund requests`
            }
            description="Customers will see a Request refund button on their orders."
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1080px] text-left text-sm">
              <thead className="border-b bg-black/[0.025] text-[11px] uppercase tracking-wider text-black/40">
                <tr>
                  <th className="px-6 py-4">Request</th>
                  <th className="px-6 py-4">Order</th>
                  <th className="px-6 py-4">Customer</th>
                  <th className="px-6 py-4">Reason</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4">Requested</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {requests.map((request) => (
                  <tr
                    key={request.id}
                    className="transition hover:bg-white/70"
                  >
                    <td className="px-6 py-5">
                      <p className="font-bold">#{request.id}</p>
                      <p className="mt-1 text-xs text-black/40">
                        {request.refund
                          ? `Refunded ${minorMoney(
                              request.refund.amount,
                              request.order.currency,
                            )}`
                          : minorMoney(
                              request.order.totalAmount,
                              request.order.currency,
                            )}
                      </p>
                    </td>
                    <td className="px-6 py-5">
                      <p className="font-semibold">
                        {request.order.orderNumber}
                      </p>
                      <p className="mt-1 text-xs text-black/40">
                        Order #{request.orderId}
                      </p>
                    </td>
                    <td className="px-6 py-5">
                      <p className="font-semibold">
                        {request.order.customerName}
                      </p>
                      <p className="mt-1 text-xs text-black/40">
                        {request.order.customerEmail}
                      </p>
                    </td>
                    <td className="max-w-[260px] px-6 py-5">
                      <p className="line-clamp-2 text-black/70">
                        {request.reason}
                      </p>
                      {request.decisionNote && (
                        <p className="mt-1 text-xs italic text-black/40">
                          Note: {request.decisionNote}
                        </p>
                      )}
                    </td>
                    <td className="px-6 py-5">
                      <RefundRequestStatusBadge status={request.status} />
                      {request.refund?.status === "FAILED" && (
                        <p className="mt-1 text-xs text-red-600">
                          Refund failed at the gateway
                        </p>
                      )}
                    </td>
                    <td className="px-6 py-5 text-black/55">
                      <p>
                        {new Date(request.createdAt).toLocaleDateString("en-BD")}
                      </p>
                      {request.reviewedAt && (
                        <p className="mt-1 text-xs text-black/40">
                          {new Date(request.reviewedAt).toLocaleString("en-BD")}
                        </p>
                      )}
                    </td>
                    <td className="px-6 py-5">
                      {request.status === "PENDING" ? (
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="outline"
                            className="h-9 px-3"
                            onClick={() =>
                              setDecision({ request, action: "approve" })
                            }
                          >
                            <CheckCircle2 size={15} /> Approve
                          </Button>
                          <Button
                            variant="ghost"
                            className="h-9 px-3"
                            onClick={() =>
                              setDecision({ request, action: "deny" })
                            }
                          >
                            <XCircle size={15} /> Deny
                          </Button>
                        </div>
                      ) : (
                        <div className="flex justify-end">
                          <span className="text-xs text-black/40">
                            {request.refund?.status === "SUCCEEDED"
                              ? "Refunded"
                              : request.refund?.status === "PENDING"
                                ? "Refunding…"
                                : "—"}
                          </span>
                        </div>
                      )}
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

      <RefundRequestDecisionDialog
        decision={decision}
        onClose={() => setDecision(null)}
      />
    </section>
  );
}

function RefundRequestDecisionDialog({
  decision,
  onClose,
}: {
  decision: { request: RefundRequest; action: "approve" | "deny" } | null;
  onClose(): void;
}) {
  const { accessToken } = useAuth();
  const queryClient = useQueryClient();
  const [note, setNote] = useState("");
  const [amount, setAmount] = useState("");
  const isApprove = decision?.action === "approve";

  useEffect(() => {
    if (decision) {
      setNote("");
      setAmount(
        isApprove
          ? (decision.request.order.totalAmount / 100).toFixed(2)
          : "",
      );
    }
  }, [decision, isApprove]);

  const amountMinor = isApprove ? Math.round(Number(amount) * 100) : 0;
  const canSubmit =
    !isApprove ||
    (!Number.isNaN(Number(amount)) && Number(amount) > 0 && amountMinor > 0);

  const decide = useMutation({
    mutationFn: () => {
      const request = decision!.request;
      const path = isApprove ? "approve" : "deny";
      const body: { note?: string; amount?: number } = {};
      if (note.trim()) body.note = note.trim();
      if (isApprove) body.amount = amountMinor;
      return apiFetch<RefundRequest>(
        `/refund-requests/admin/${request.id}/${path}`,
        {
          method: "PATCH",
          body: JSON.stringify(body),
        },
        accessToken,
      );
    },
    onSuccess: () => {
      toast.success(
        isApprove ? "Refund request approved" : "Refund request denied",
      );
      onClose();
      setNote("");
      void queryClient.invalidateQueries({
        queryKey: ["admin", "refund-requests"],
      });
      void queryClient.invalidateQueries({ queryKey: ["admin", "orders"] });
    },
    onError: (error: Error) => toast.error(error.message),
  });

  return (
    <Dialog.Root
      open={Boolean(decision)}
      onOpenChange={(open) => {
        if (!open) {
          onClose();
          setNote("");
          setAmount("");
        }
      }}
    >
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-[80] bg-black/45 backdrop-blur-sm" />
        <Dialog.Content className="fixed left-1/2 top-1/2 z-[90] w-[calc(100%-2rem)] max-w-md -translate-x-1/2 -translate-y-1/2 rounded-[2rem] border bg-paper p-7 shadow-2xl focus:outline-none">
          <div
            className={`grid h-12 w-12 place-items-center rounded-2xl ${
              isApprove
                ? "bg-emerald-100 text-emerald-700"
                : "bg-red-100 text-red-700"
            }`}
          >
            {isApprove ? <CheckCircle2 size={21} /> : <XCircle size={21} />}
          </div>
          <Dialog.Title className="display mt-5 text-3xl">
            {isApprove ? "Approve refund" : "Deny refund"}
          </Dialog.Title>
          <Dialog.Description className="mt-3 text-sm leading-6 text-black/55">
            {decision?.request.order.orderNumber} ·{" "}
            {minorMoney(
              decision?.request.order.totalAmount ?? 0,
              decision?.request.order.currency ?? "",
            )}
            {isApprove ? "Choose the amount to return to the customer." : "The customer will see the request was denied."}
          </Dialog.Description>

          <div className="mt-6 rounded-2xl bg-black/[0.03] p-4 text-sm">
            <p className="font-bold">Customer reason</p>
            <p className="mt-1 leading-6 text-black/60">
              {decision?.request.reason}
            </p>
          </div>

          <form
            className="mt-6"
            onSubmit={(event) => {
              event.preventDefault();
              if (decision && canSubmit) decide.mutate();
            }}
          >
            {isApprove && (
              <Field
                label="Amount to return"
                hint={`Leave at the full amount to return everything (${minorMoney(
                  decision?.request.order.totalAmount ?? 0,
                  decision?.request.order.currency ?? "",
                )}).`}
              >
                <Input
                  type="number"
                  min={0.01}
                  step="0.01"
                  max={(decision?.request.order.totalAmount ?? 0) / 100}
                  value={amount}
                  onChange={(event) => setAmount(event.target.value)}
                  placeholder="Full amount"
                />
              </Field>
            )}
            <label className="mt-5 block">
              <span className="mb-2 block text-sm font-bold">
                Note (optional)
              </span>
              <Textarea
                rows={3}
                value={note}
                onChange={(event) => setNote(event.target.value)}
                placeholder={
                  isApprove
                    ? "e.g. Approved; full amount returned"
                    : "e.g. Outside the 7-day return window"
                }
                autoFocus
              />
            </label>

            <div className="mt-6 flex justify-end gap-3">
              <Button
                type="button"
                variant="ghost"
                onClick={() => {
                  onClose();
                  setNote("");
                  setAmount("");
                }}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant={isApprove ? "primary" : "danger"}
                loading={decide.isPending}
                disabled={!canSubmit}
              >
                {isApprove ? "Approve refund" : "Deny refund"}
              </Button>
            </div>
          </form>

          <Dialog.Close
            aria-label="Close"
            className="absolute right-5 top-5 rounded-full p-2 hover:bg-black/5 focus-visible:ring-2 focus-visible:ring-accent"
          >
            <X size={18} />
          </Dialog.Close>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

export function RefundRequestStatusBadge({
  status,
}: {
  status: RefundRequestStatus;
}) {
  const tone =
    status === "APPROVED"
      ? "success"
      : status === "DENIED"
        ? "danger"
        : "warning";
  return <Badge tone={tone}>{status.replaceAll("_", " ")}</Badge>;
}
