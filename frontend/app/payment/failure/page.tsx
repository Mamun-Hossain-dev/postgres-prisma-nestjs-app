import type { Metadata } from 'next';
import { PaymentResultPage } from '@/components/pages/payment-result-page';

export const metadata: Metadata = { title: 'Payment failed - DeviceDock' };

export default function Page() {
  return <PaymentResultPage kind="failure" />;
}
