import type { Metadata } from 'next';
import { ProductForm } from '@/components/admin/product-form';

export const metadata: Metadata = {
  title: 'Create product — DeviceDock Admin',
};

export default function Page() {
  return <ProductForm />;
}
