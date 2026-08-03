"use client";

import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useAuth } from "@/components/auth-provider";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { apiFetch } from "@/lib/api";
import type { Order, OrderStatus } from "@/lib/types";

const transitions: Partial<Record<OrderStatus, OrderStatus[]>> = {
  PAYMENT_PENDING: ["CANCELLED"],
  PAYMENT_PROCESSING: ["CANCELLED"],
  PAYMENT_FAILED: ["CANCELLED"],
  PAID: ["PROCESSING", "CANCELLED"],
  COD_CONFIRMED: ["PROCESSING", "CANCELLED"],
  PROCESSING: ["SHIPPED", "CANCELLED"],
  SHIPPED: ["DELIVERED"],
};

export function AdminOrderStatusControl({ order }: { order: Order }) {
  const { accessToken } = useAuth();
  const queryClient = useQueryClient();
  const options = transitions[order.status] ?? [];
  const [status, setStatus] = useState<OrderStatus | "">(options[0] ?? "");
  const [confirmingCancellation, setConfirmingCancellation] = useState(false);
  const update = useMutation({
    mutationFn: (nextStatus: OrderStatus) =>
      apiFetch<Order>(
        `/orders/admin/${order.id}/status`,
        { method: "PATCH", body: JSON.stringify({ status: nextStatus }) },
        accessToken,
      ),
    onSuccess: async () => {
      setConfirmingCancellation(false);
      toast.success("Order status updated");
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: ["admin", "orders", order.id],
        }),
        queryClient.invalidateQueries({ queryKey: ["admin", "orders"] }),
      ]);
    },
    onError: (error: Error) => toast.error(error.message),
  });

  if (!options.length) {
    return (
      <p className="text-xs leading-5 text-white/40">
        This order has reached a final status.
      </p>
    );
  }

  const submit = () => {
    if (!status) return;
    if (status === "CANCELLED") {
      setConfirmingCancellation(true);
      return;
    }
    update.mutate(status);
  };

  return (
    <>
      <div className="grid gap-3">
        <select
          value={status}
          onChange={(event) => setStatus(event.target.value as OrderStatus)}
          className="h-11 rounded-xl border border-white/15 bg-white/10 px-3 text-sm text-white focus:border-accent"
        >
          {options.map((option) => (
            <option key={option} value={option} className="text-ink">
              {option.replaceAll("_", " ")}
            </option>
          ))}
        </select>
        <Button
          type="button"
          variant="secondary"
          loading={update.isPending}
          onClick={submit}
        >
          Update fulfilment status
        </Button>
      </div>
      <ConfirmDialog
        open={confirmingCancellation}
        onOpenChange={setConfirmingCancellation}
        title="Cancel this order?"
        description="The order will be cancelled. Any successful Stripe payment or COD deposit will be refunded automatically."
        confirmLabel="Cancel and refund"
        danger
        loading={update.isPending}
        onConfirm={() => update.mutate("CANCELLED")}
      />
    </>
  );
}
