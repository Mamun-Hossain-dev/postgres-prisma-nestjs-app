import type { Metadata } from 'next';
import { AdminNewsletter } from '@/components/admin/admin-newsletter';

export const metadata: Metadata = { title: 'Broadcasts — DeviceDock Admin' };
export default function Page() {
  return <AdminNewsletter />;
}
