import type { Metadata } from 'next';
import { CheckoutPage } from '@/components/pages/checkout-page';

export const metadata: Metadata = { title: 'Checkout — DeviceDock' };

export default function Page() {
  return <CheckoutPage />;
}
