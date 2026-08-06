"use client";

import { useEffect, useState } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { RotateCcw, X } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/components/auth-provider";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { Textarea } from "@/components/ui/textarea";
import { apiFetch, minorMoney } from "@/lib/api";
import type { RefundRequest } from "@/lib/types";

export function RefundRequestDialog({
  open,
  onOpenChange,
  orderId,
  orderNumber,
  amount,
  currency,
}: {
  open: boolean;
  onOpenChange(open: boolean): void;
  orderId: number;
  orderNumber: string;
  amount: number;
  currency: string;
}) {
  const { accessToken } = useAuth();
  const queryClient = useQueryClient();
  const [reason, setReason] = useState("");

  useEffect(() => {
    if (open) setReason("");
  }, [open]);

  const submit = useMutation({
    mutationFn: () =>
      apiFetch<RefundRequest>(
        "/refund-requests",
        {
          method: "POST",
          body: JSON.stringify({ orderId, reason: reason.trim() }),
        },
        accessToken,
      ),
    onSuccess: () => {
      toast.success("Refund request submitted for review");
      onOpenChange(false);
      void queryClient.invalidateQueries({ queryKey: ["refund-requests"] });
      void queryClient.invalidateQueries({ queryKey: ["orders"] });
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const canSubmit = reason.trim().length >= 3;

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
            Order {orderNumber} · {minorMoney(amount, currency)}. Our team will
            review your request before the payment is returned.
          </Dialog.Description>

          <form
            className="mt-7 space-y-5"
            onSubmit={(event) => {
              event.preventDefault();
              if (canSubmit) submit.mutate();
            }}
          >
            <Field
              label="Reason"
              hint="Tell us why you would like your money back."
            >
              <Textarea
                rows={4}
                value={reason}
                onChange={(event) => setReason(event.target.value)}
                placeholder="e.g. Item arrived damaged and I would like a full refund"
                autoFocus
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
                loading={submit.isPending}
                disabled={!canSubmit}
              >
                Submit request
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
