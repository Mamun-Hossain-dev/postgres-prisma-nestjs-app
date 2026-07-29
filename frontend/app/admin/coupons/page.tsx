import type { Metadata } from 'next';
import { TicketPercent } from 'lucide-react';
import { AdminFeaturePage } from '@/components/admin/admin-feature-page';

export const metadata: Metadata = { title: 'Coupons — DeviceDock Admin' };
export default function Page() {
  return (
    <AdminFeaturePage
      eyebrow="Promotions"
      title="Coupons."
      description="Create controlled discounts and promotional campaigns."
      icon={<TicketPercent />}
      dependency="Coupon validation, usage limits and checkout integration endpoints."
    />
  );
}
