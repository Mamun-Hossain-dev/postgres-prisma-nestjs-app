import type { Metadata } from 'next';
import { PaymentCompletePage } from '@/components/pages/payment-complete-page';

export const metadata: Metadata = { title: 'Payment status - DeviceDock' };

export default function Page() {
  return <PaymentCompletePage />;
}
