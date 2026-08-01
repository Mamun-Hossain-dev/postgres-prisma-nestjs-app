import type { Metadata } from 'next';
import { EditProduct } from '@/components/admin/edit-product';

export const metadata: Metadata = {
  title: 'Edit product - DeviceDock Admin',
};

export default function Page({ params }: { params: { id: string } }) {
  return <EditProduct productId={params.id} />;
}
