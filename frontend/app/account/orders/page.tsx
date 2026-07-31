import type { Metadata } from 'next';
import { OrdersPage } from '@/components/account/orders-page';

export const metadata: Metadata = { title: 'Orders — DeviceDock' };

export default function Page() {
  return <OrdersPage />;
}
