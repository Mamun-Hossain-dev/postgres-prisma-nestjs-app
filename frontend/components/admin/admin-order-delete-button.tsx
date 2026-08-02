"use client";

import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/components/auth-provider";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { apiFetch } from "@/lib/api";
import type { OrderStatus } from "@/lib/types";

export function canDeleteOrder(status: OrderStatus) {
  return status === "PAYMENT_PENDING" || status === "CANCELLED";
}

export function AdminOrderDeleteButton({
  orderId,
  orderNumber,
  compact = false,
  redirectAfterDelete = false,
}: {
  orderId: number;
  orderNumber: string;
  compact?: boolean;
  redirectAfterDelete?: boolean;
}) {
  const { accessToken } = useAuth();
  const queryClient = useQueryClient();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const remove = useMutation({
    mutationFn: () =>
      apiFetch<null>(
        `/orders/admin/${orderId}`,
        { method: "DELETE" },
        accessToken,
      ),
    onSuccess: async () => {
      setOpen(false);
      toast.success("Order deleted");
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["admin", "orders"] }),
        queryClient.invalidateQueries({ queryKey: ["orders"] }),
      ]);
      if (redirectAfterDelete) router.replace("/admin/orders");
    },
    onError: (error: Error) => toast.error(error.message),
  });

  return (
    <>
      <Button
        type="button"
        variant="danger"
        className={compact ? "h-9 px-3 text-xs" : undefined}
        onClick={() => setOpen(true)}
      >
        <Trash2 size={15} /> {compact ? "Delete" : "Delete order"}
      </Button>
      <ConfirmDialog
        open={open}
        onOpenChange={(nextOpen) => !remove.isPending && setOpen(nextOpen)}
        title="Delete this order?"
        description={`“${orderNumber}” and its checkout and payment records will be permanently deleted. This cannot be undone.`}
        confirmLabel="Delete order"
        danger
        loading={remove.isPending}
        onConfirm={() => remove.mutate()}
      />
    </>
  );
}
