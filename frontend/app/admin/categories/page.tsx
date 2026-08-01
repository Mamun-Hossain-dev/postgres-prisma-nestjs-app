import type { Metadata } from 'next';
import { Tags } from 'lucide-react';
import { AdminFeaturePage } from '@/components/admin/admin-feature-page';

export const metadata: Metadata = { title: 'Categories - DeviceDock Admin' };
export default function Page() {
  return (
    <AdminFeaturePage
      eyebrow="Catalog taxonomy"
      title="Categories."
      description="Organize the catalog into customer-friendly departments."
      icon={<Tags />}
      dependency="Category CRUD endpoints. Products currently use the backend ProductCategory enum."
    />
  );
}
