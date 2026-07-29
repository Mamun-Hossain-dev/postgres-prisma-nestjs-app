'use client';

import * as Dialog from '@radix-ui/react-dialog';
import { AlertTriangle, X } from 'lucide-react';
import { Button } from './button';

export function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel,
  onConfirm,
  loading,
  danger = false,
}: {
  open: boolean;
  onOpenChange(open: boolean): void;
  title: string;
  description: string;
  confirmLabel: string;
  onConfirm(): void;
  loading?: boolean;
  danger?: boolean;
}) {
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-[80] bg-black/45 backdrop-blur-sm data-[state=open]:animate-in data-[state=closed]:animate-out" />
        <Dialog.Content className="fixed left-1/2 top-1/2 z-[90] w-[calc(100%-2rem)] max-w-md -translate-x-1/2 -translate-y-1/2 rounded-[2rem] border bg-paper p-7 shadow-2xl focus:outline-none">
          <div className="grid h-12 w-12 place-items-center rounded-2xl bg-red-100 text-red-700">
            <AlertTriangle size={21} />
          </div>
          <Dialog.Title className="display mt-5 text-3xl">{title}</Dialog.Title>
          <Dialog.Description className="mt-3 text-sm leading-6 text-black/55">
            {description}
          </Dialog.Description>
          <div className="mt-7 flex justify-end gap-3">
            <Dialog.Close asChild>
              <Button type="button" variant="ghost">
                Cancel
              </Button>
            </Dialog.Close>
            <Button
              type="button"
              variant={danger ? 'danger' : 'primary'}
              loading={loading}
              onClick={onConfirm}
            >
              {confirmLabel}
            </Button>
          </div>
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
