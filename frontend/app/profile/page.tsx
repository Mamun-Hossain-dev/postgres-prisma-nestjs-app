import type { Metadata } from 'next';
import { ProfilePage } from '@/components/pages/profile-page';

export const metadata: Metadata = {
  title: 'Account overview — DeviceDock',
};

export default function Page() {
  return <ProfilePage />;
}
