import type { Metadata } from 'next';
import { SettingsPage } from '@/components/pages/settings-page';

export const metadata: Metadata = {
  title: 'Personal information — DeviceDock',
};

export default function Page() {
  return <SettingsPage />;
}
