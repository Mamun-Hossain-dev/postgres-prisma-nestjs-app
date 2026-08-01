import type { Metadata } from 'next';
import { AdminContactMessages } from '@/components/admin/admin-contact-messages';

export const metadata: Metadata = { title: 'Messages - DeviceDock Admin' };

export default function Page() {
  return <AdminContactMessages />;
}
