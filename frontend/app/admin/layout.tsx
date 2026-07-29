import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { AdminShell } from '@/components/admin/admin-shell';
import { authOptions } from '@/lib/auth';

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession(authOptions);
  if (!session) redirect('/login?callbackUrl=/admin');
  if (session.user.role !== 'ADMIN') redirect('/profile');

  return <AdminShell>{children}</AdminShell>;
}
