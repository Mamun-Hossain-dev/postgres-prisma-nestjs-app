import type { Metadata } from 'next';
import { AdminProducts } from '@/components/admin/admin-products';

export const metadata: Metadata = {
  title: 'Products — DeviceDock Admin',
};

export default function Page() {
  return <AdminProducts />;
}
