import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { AdminNav } from '@/components/admin-nav';
import { authOptions } from '@/lib/auth';

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession(authOptions);
  if (!session) redirect('/login?callbackUrl=/admin');
  if (session.user.role !== 'ADMIN') redirect('/profile');

  return (
    <div className="min-h-screen bg-[#ebe6da]">
      <div className="mx-auto grid max-w-[1440px] gap-7 px-5 py-10 lg:grid-cols-[270px_1fr] lg:px-8">
        <AdminNav />
        <div>{children}</div>
      </div>
    </div>
  );
}
