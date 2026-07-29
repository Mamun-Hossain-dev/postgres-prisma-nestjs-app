import type { Metadata } from 'next';
import { Bell } from 'lucide-react';
import { AdminFeaturePage } from '@/components/admin/admin-feature-page';

export const metadata: Metadata = { title: 'Notifications — DeviceDock Admin' };
export default function Page() {
  return (
    <AdminFeaturePage
      eyebrow="Operations feed"
      title="Notifications."
      description="See important store events and operational alerts."
      icon={<Bell />}
      dependency="Persisted admin notification feed and read-state endpoints."
    />
  );
}
