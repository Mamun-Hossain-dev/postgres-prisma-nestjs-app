import type { Metadata } from 'next';
import { Building2 } from 'lucide-react';
import { AdminFeaturePage } from '@/components/admin/admin-feature-page';

export const metadata: Metadata = { title: 'Brands — DeviceDock Admin' };
export default function Page() {
  return (
    <AdminFeaturePage
      eyebrow="Manufacturers"
      title="Brands."
      description="Curate manufacturers and their storefront presentation."
      icon={<Building2 />}
      dependency="Brand CRUD and brand-asset endpoints. Product forms currently accept a brand name."
    />
  );
}
