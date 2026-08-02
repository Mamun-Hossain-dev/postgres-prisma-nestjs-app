import type { Metadata } from 'next';
import { AdminOrderDetails } from '@/components/admin/admin-order-details';

export const metadata: Metadata = { title: 'Order - DeviceDock Admin' };

export default function Page({ params }: { params: { id: string } }) {
  return <AdminOrderDetails orderId={Number(params.id)} />;
}
