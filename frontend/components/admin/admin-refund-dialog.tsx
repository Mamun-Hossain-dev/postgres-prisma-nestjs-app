"use client";

import { useEffect, useState } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { RotateCcw, X } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/components/auth-provider";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/field";
import { Textarea } from "@/components/ui/textarea";
import { apiFetch, minorMoney } from "@/lib/api";
import type { Refund } from "@/lib/types";

export function AdminRefundDialog({
  open,
  onOpenChange,
  paymentId,
  paymentAmount,
  currency,
}: {
  open: boolean;
  onOpenChange(open: boolean): void;
  paymentId?: number | null;
  paymentAmount?: number;
  currency?: string;
}) {
  const { accessToken } = useAuth();
  const queryClient = useQueryClient();
  const [paymentIdValue, setPaymentIdValue] = useState(
    paymentId ? String(paymentId) : "",
  );
  const [amount, setAmount] = useState("");
  const [reason, setReason] = useState("");

  useEffect(() => {
    if (open) {
      setPaymentIdValue(paymentId ? String(paymentId) : "");
      setAmount(paymentAmount ? (paymentAmount / 100).toFixed(2) : "");
      setReason("");
    }
  }, [open, paymentId, paymentAmount]);

  const request = useMutation({
    mutationFn: () =>
      apiFetch<Refund>(
        "/refunds",
        {
          method: "POST",
          body: JSON.stringify({
            paymentId: Number(paymentIdValue),
            ...(amount.trim() ? { amount: Math.round(Number(amount) * 100) } : {}),
            ...(reason.trim() ? { reason: reason.trim() } : {}),
            idempotencyKey: crypto.randomUUID(),
          }),
        },
        accessToken,
      ),
    onSuccess: (refund) => {
      toast.success(
        refund.status === "SUCCEEDED"
          ? "Refund completed"
          : "Refund requested",
      );
      onOpenChange(false);
      void queryClient.invalidateQueries({ queryKey: ["admin", "refunds"] });
      void queryClient.invalidateQueries({ queryKey: ["admin", "orders"] });
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const canSubmit =
    Number(paymentIdValue) > 0 &&
    (!amount.trim() || (Number(amount) > 0 && !Number.isNaN(Number(amount))));

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-[80] bg-black/45 backdrop-blur-sm" />
        <Dialog.Content className="fixed left-1/2 top-1/2 z-[90] w-[calc(100%-2rem)] max-w-md -translate-x-1/2 -translate-y-1/2 rounded-[2rem] border bg-paper p-7 shadow-2xl focus:outline-none">
          <div className="grid h-12 w-12 place-items-center rounded-2xl bg-orange-100 text-orange-700">
            <RotateCcw size={21} />
          </div>
          <Dialog.Title className="display mt-5 text-3xl">
            Request a refund
          </Dialog.Title>
          <Dialog.Description className="mt-3 text-sm leading-6 text-black/55">
            Refund a captured payment back to the customer. Submitting is
            idempotent, so double-clicks will not create duplicates.
          </Dialog.Description>

          <form
            className="mt-7 space-y-5"
            onSubmit={(event) => {
              event.preventDefault();
              if (canSubmit) request.mutate();
            }}
          >
            <Field label="Payment ID">
              <Input
                type="number"
                min={1}
                value={paymentIdValue}
                onChange={(event) => setPaymentIdValue(event.target.value)}
                placeholder="e.g. 42"
                autoFocus
                disabled={Boolean(paymentId)}
              />
            </Field>
            <Field
              label="Amount"
              hint={
                paymentAmount
                  ? `Leave empty to refund the full payment (${minorMoney(paymentAmount, currency)}).`
                  : "Leave empty to refund the full payment amount."
              }
            >
              <Input
                type="number"
                min={0}
                step="0.01"
                value={amount}
                onChange={(event) => setAmount(event.target.value)}
                placeholder="Full amount"
              />
            </Field>
            <Field label="Reason (optional)">
              <Textarea
                rows={3}
                value={reason}
                onChange={(event) => setReason(event.target.value)}
                placeholder="e.g. Customer requested cancellation"
              />
            </Field>

            <div className="flex justify-end gap-3">
              <Dialog.Close asChild>
                <Button type="button" variant="ghost">
                  Cancel
                </Button>
              </Dialog.Close>
              <Button
                type="submit"
                loading={request.isPending}
                disabled={!canSubmit}
              >
                Request refund
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
