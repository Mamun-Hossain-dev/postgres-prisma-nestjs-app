"use client";

import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Mail } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/components/auth-provider";
import { Button } from "@/components/ui/button";
import { apiFetch } from "@/lib/api";
import type { Order } from "@/lib/types";

export function AdminOrderResendButton({
  orderId,
  orderNumber,
  compact = false,
}: {
  orderId: number;
  orderNumber: string;
  compact?: boolean;
}) {
  const { accessToken } = useAuth();
  const queryClient = useQueryClient();
  const [sent, setSent] = useState(false);

  const resend = useMutation({
    mutationFn: () =>
      apiFetch<{ orderId: number; eventId: string }>(
        `/orders/admin/${orderId}/resend-confirmation`,
        { method: "POST" },
        accessToken,
      ),
    onSuccess: () => {
      setSent(true);
      toast.success(`Confirmation email resent for ${orderNumber}`);
      void queryClient.invalidateQueries({
        queryKey: ["admin", "orders", orderId],
      });
    },
    onError: (error: Error) => toast.error(error.message),
  });

  return (
    <Button
      type="button"
      variant={compact ? "outline" : "secondary"}
      className={compact ? "h-9 px-3 text-xs" : ""}
      disabled={sent}
      loading={resend.isPending}
      onClick={() => resend.mutate()}
      title={
        sent
          ? "Confirmation already resent"
          : "Resend the order confirmation email"
      }
    >
      <Mail size={14} />
      {sent ? "Resent" : "Resend email"}
    </Button>
  );
}
