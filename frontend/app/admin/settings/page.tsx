import type { Metadata } from 'next';
import { Settings } from 'lucide-react';
import { AdminFeaturePage } from '@/components/admin/admin-feature-page';

export const metadata: Metadata = { title: 'Settings - DeviceDock Admin' };
export default function Page() {
  return (
    <AdminFeaturePage
      eyebrow="Store configuration"
      title="Settings."
      description="Manage storefront identity and operational preferences."
      icon={<Settings />}
      dependency="Store-settings persistence and asset-upload endpoints."
    />
  );
}
