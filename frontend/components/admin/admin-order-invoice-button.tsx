'use client';

import { useMutation } from '@tanstack/react-query';
import { Download } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/components/auth-provider';
import { Button } from '@/components/ui/button';
import { apiFetchBlob } from '@/lib/api';

export function AdminOrderInvoiceButton({
  orderId,
  orderNumber,
  compact = false,
}: {
  orderId: number;
  orderNumber: string;
  compact?: boolean;
}) {
  const { accessToken } = useAuth();
  const invoice = useMutation({
    mutationFn: () =>
      apiFetchBlob(`/orders/admin/${orderId}/invoice`, accessToken),
    onSuccess: (blob) => {
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement('a');
      anchor.href = url;
      anchor.download = `devicedock-${orderNumber}.pdf`;
      anchor.click();
      URL.revokeObjectURL(url);
    },
    onError: (error: Error) => toast.error(error.message),
  });

  return (
    <Button
      variant="outline"
      className={compact ? 'h-9 px-3 text-xs' : undefined}
      loading={invoice.isPending}
      onClick={() => invoice.mutate()}
    >
      <Download size={15} /> {compact ? 'Invoice' : 'Download invoice'}
    </Button>
  );
}
