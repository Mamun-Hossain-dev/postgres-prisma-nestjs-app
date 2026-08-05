import type { Metadata } from 'next';
import { AdminRefunds } from '@/components/admin/admin-refunds';

export const metadata: Metadata = { title: 'Refunds - DeviceDock Admin' };
export default function Page() {
  return <AdminRefunds />;
}
