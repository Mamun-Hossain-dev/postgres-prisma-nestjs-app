import type { Metadata } from 'next';
import { CartPage } from '@/components/pages/cart-page';

export const metadata: Metadata = {
  title: 'Your cart — DeviceDock',
};

export default function Page() {
  return <CartPage />;
}
