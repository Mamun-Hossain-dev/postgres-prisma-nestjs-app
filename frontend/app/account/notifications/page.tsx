import type { Metadata } from 'next';
import { Bell } from 'lucide-react';
import { AccountFeaturePage } from '@/components/account/account-feature-page';

export const metadata: Metadata = { title: 'Notifications — DeviceDock' };

export default function Page() {
  return (
    <AccountFeaturePage
      active="notifications"
      eyebrow="Communication"
      title="Notifications."
      description="Choose how DeviceDock keeps you informed about orders and products."
      icon={<Bell />}
      note="Notification preferences need a user-preferences API before settings can safely follow the account across devices."
    />
  );
}
