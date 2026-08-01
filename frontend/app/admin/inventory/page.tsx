import type { Metadata } from 'next';
import { Warehouse } from 'lucide-react';
import { AdminFeaturePage } from '@/components/admin/admin-feature-page';

export const metadata: Metadata = { title: 'Inventory - DeviceDock Admin' };
export default function Page() {
  return (
    <AdminFeaturePage
      eyebrow="Stock control"
      title="Inventory."
      description="Monitor adjustments, low-stock thresholds and stock movement."
      icon={<Warehouse />}
      dependency="Inventory movement history and stock-adjustment endpoints. Current stock remains editable through Products."
    />
  );
}
