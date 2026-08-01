import type { Metadata } from 'next';
import { ShopPage } from '@/components/pages/shop-page';

export const metadata: Metadata = {
  title: 'Shop the collection - DeviceDock',
  description: 'Browse carefully selected phones, laptops, tablets and audio.',
};

export default function Page() {
  return <ShopPage />;
}
