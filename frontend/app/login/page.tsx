import type { Metadata } from 'next';
import { LoginPage } from '@/components/pages/login-page';

export const metadata: Metadata = {
  title: 'Sign in — DeviceDock',
};

export default function Page() {
  return <LoginPage />;
}
