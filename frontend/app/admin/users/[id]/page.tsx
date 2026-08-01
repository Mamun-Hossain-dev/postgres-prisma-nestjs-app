import type { Metadata } from 'next';
import { AdminUserDetails } from '@/components/admin/admin-user-details';

export const metadata: Metadata = {
  title: 'Customer details - DeviceDock Admin',
};

export default function Page({ params }: { params: { id: string } }) {
  return <AdminUserDetails userId={params.id} />;
}
