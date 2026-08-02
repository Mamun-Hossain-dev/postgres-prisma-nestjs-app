import type { Metadata } from 'next';
import { AdminOrders } from '@/components/admin/admin-orders';

export const metadata: Metadata = { title: 'Orders - DeviceDock Admin' };
export default function Page() {
  return <AdminOrders />;
}
