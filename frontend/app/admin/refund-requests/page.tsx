import type { Metadata } from 'next';
import { AdminRefundRequests } from '@/components/admin/admin-refund-requests';

export const metadata: Metadata = {
  title: 'Refund Requests - DeviceDock Admin',
};
export default function Page() {
  return <AdminRefundRequests />;
}
