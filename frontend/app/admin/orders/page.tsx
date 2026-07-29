import type { Metadata } from 'next';
import { ClipboardList } from 'lucide-react';
import { AdminFeaturePage } from '@/components/admin/admin-feature-page';

export const metadata: Metadata = { title: 'Orders — DeviceDock Admin' };
export default function Page() {
  return (
    <AdminFeaturePage
      eyebrow="Fulfilment"
      title="Orders."
      description="Review and fulfil customer purchases."
      icon={<ClipboardList />}
      dependency="Order, checkout, payment and fulfilment endpoints."
    />
  );
}
