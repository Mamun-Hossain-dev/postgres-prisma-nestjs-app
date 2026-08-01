import type { Metadata } from 'next';
import { Heart } from 'lucide-react';
import { AccountFeaturePage } from '@/components/account/account-feature-page';

export const metadata: Metadata = { title: 'Wishlist - DeviceDock' };

export default function Page() {
  return (
    <AccountFeaturePage
      active="wishlist"
      eyebrow="Saved for later"
      title="Your wishlist."
      description="A considered shortlist of products you want to revisit."
      icon={<Heart />}
      note="A persistent wishlist endpoint is not available yet, so products are not stored locally as misleading account data."
    />
  );
}
