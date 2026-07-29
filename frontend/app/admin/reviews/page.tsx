import type { Metadata } from 'next';
import { Star } from 'lucide-react';
import { AdminFeaturePage } from '@/components/admin/admin-feature-page';

export const metadata: Metadata = { title: 'Reviews — DeviceDock Admin' };
export default function Page() {
  return (
    <AdminFeaturePage
      eyebrow="Customer trust"
      title="Reviews."
      description="Moderate verified product feedback."
      icon={<Star />}
      dependency="Review creation, moderation and pagination endpoints."
    />
  );
}
