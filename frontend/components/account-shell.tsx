import Link from 'next/link';
import { ArrowLeft, Settings, UserRound } from 'lucide-react';

export function AccountShell({
  active,
  children,
}: {
  active: 'profile' | 'settings';
  children: React.ReactNode;
}) {
  return (
    <div className="mx-auto min-h-[75vh] max-w-7xl px-5 py-12 lg:px-8 lg:py-16">
      <Link
        href="/shop"
        className="inline-flex items-center gap-2 text-sm font-semibold text-black/55"
      >
        <ArrowLeft size={16} /> Back to shop
      </Link>
      <div className="mt-8 grid gap-8 lg:grid-cols-[260px_1fr]">
        <aside className="h-fit rounded-[2rem] bg-ink p-4 text-white">
          <p className="px-4 pb-4 pt-3 text-xs font-bold uppercase tracking-[0.2em] text-white/40">
            Your account
          </p>
          <AccountNav
            href="/profile"
            label="Profile"
            active={active === 'profile'}
            icon={<UserRound size={17} />}
          />
          <AccountNav
            href="/settings"
            label="Settings"
            active={active === 'settings'}
            icon={<Settings size={17} />}
          />
        </aside>
        {children}
      </div>
    </div>
  );
}

function AccountNav({
  href,
  label,
  active,
  icon,
}: {
  href: string;
  label: string;
  active: boolean;
  icon: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className={`flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-semibold ${active ? 'bg-white text-ink' : 'text-white/65 hover:bg-white/10'}`}
    >
      {icon} {label}
    </Link>
  );
}
