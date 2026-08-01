import type { Metadata } from 'next';
import { ProductPage } from '@/components/pages/product-page';

export const metadata: Metadata = {
  title: 'Product details - DeviceDock',
};

export default function Page({ params }: { params: { id: string } }) {
  return <ProductPage productId={params.id} />;
}
