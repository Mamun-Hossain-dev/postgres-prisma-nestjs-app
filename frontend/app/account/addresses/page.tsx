import type { Metadata } from 'next';
import { MapPin } from 'lucide-react';
import { AccountFeaturePage } from '@/components/account/account-feature-page';

export const metadata: Metadata = { title: 'Addresses — DeviceDock' };

export default function Page() {
  return (
    <AccountFeaturePage
      active="addresses"
      eyebrow="Delivery details"
      title="Your addresses."
      description="Saved delivery and billing locations will live here."
      icon={<MapPin />}
      note="Address storage and delivery-zone APIs are not available yet. This section is ready for that contract without showing fake addresses."
    />
  );
}
