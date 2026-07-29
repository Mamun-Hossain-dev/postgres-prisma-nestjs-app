import type { Metadata } from 'next';
import { Package } from 'lucide-react';
import { AccountFeaturePage } from '@/components/account/account-feature-page';

export const metadata: Metadata = { title: 'Orders — DeviceDock' };

export default function Page() {
  return (
    <AccountFeaturePage
      active="orders"
      eyebrow="Purchase history"
      title="Your orders."
      description="Order status, invoices and delivery tracking will appear here."
      icon={<Package />}
      note="Orders and payment APIs are intentionally deferred. Real order data will replace this state once checkout is implemented."
    />
  );
}
