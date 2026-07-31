'use client';

import { useState } from 'react';
import { Menu, Search, X, LogOut } from 'lucide-react';
import { AdminNav } from '@/components/admin-nav';
import { useAuth } from '@/components/auth-provider';
import { Button } from '@/components/ui/button';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';

export function AdminShell({ children }: { children: React.ReactNode }) {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [logoutOpen, setLogoutOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const { user, logout } = useAuth();

  const confirmLogout = async () => {
    setLoggingOut(true);
    await logout();
    window.location.href = '/login';
  };

  return (
    <div className="min-h-screen bg-[#ebe6da] lg:grid lg:grid-cols-[260px_1fr]">
      <div className="hidden lg:block">
        <div className="fixed inset-y-0 w-[260px] overflow-y-auto">
          <AdminNav />
        </div>
      </div>
      {drawerOpen && (
        <div className="fixed inset-0 z-[70] lg:hidden">
          <button
            className="absolute inset-0 bg-black/45"
            onClick={() => setDrawerOpen(false)}
            aria-label="Close navigation"
          />
          <div className="relative h-full w-[280px] max-w-[85vw] overflow-y-auto shadow-2xl">
            <button
              className="absolute right-3 top-3 z-10 rounded-full p-2 text-white hover:bg-white/10"
              onClick={() => setDrawerOpen(false)}
              aria-label="Close navigation"
            >
              <X />
            </button>
            <AdminNav onNavigate={() => setDrawerOpen(false)} />
          </div>
        </div>
      )}
      <div className="min-w-0">
        <header className="sticky top-0 z-40 flex h-20 items-center justify-between border-b bg-[#ebe6da]/90 px-5 backdrop-blur-xl sm:px-8">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setDrawerOpen(true)}
              className="rounded-xl p-2 hover:bg-black/5 lg:hidden"
              aria-label="Open navigation"
            >
              <Menu />
            </button>
            <div className="hidden items-center gap-2 rounded-full border bg-white/45 px-4 py-2.5 text-black/35 md:flex">
              <Search size={16} />
              <span className="text-xs">Manage your store</span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="text-right">
              <p className="text-sm font-bold">{user?.name}</p>
              <p className="text-[10px] uppercase tracking-wider text-black/40">
                {user?.role}
              </p>
            </div>
            <span className="grid h-10 w-10 place-items-center rounded-full bg-ink font-bold text-white">
              {user?.name?.[0]?.toUpperCase() ?? 'A'}
            </span>
            <Button
              variant="ghost"
              className="h-10 w-10 px-0"
              onClick={() => setLogoutOpen(true)}
              aria-label="Sign out"
            >
              <LogOut size={17} />
            </Button>
          </div>
        </header>
        <main className="mx-auto w-full max-w-7xl px-4 py-6 md:px-8 md:py-8">
          {children}
        </main>
      </div>
      <ConfirmDialog
        open={logoutOpen}
        onOpenChange={setLogoutOpen}
        title="Sign out of DeviceDock?"
        description="You will need to sign in again to manage the store."
        confirmLabel="Sign out"
        onConfirm={() => void confirmLogout()}
        loading={loggingOut}
      />
    </div>
  );
}
