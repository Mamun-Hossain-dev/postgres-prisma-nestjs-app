import type { ReactNode } from 'react';
import { AdminPageHeader } from '@/components/admin/admin-page-header';

export function AdminFeaturePage({
  eyebrow,
  title,
  description,
  icon,
  dependency,
}: {
  eyebrow: string;
  title: string;
  description: string;
  icon: ReactNode;
  dependency: string;
}) {
  return (
    <section>
      <AdminPageHeader eyebrow={eyebrow} title={title} description={description} />
      <div className="mt-6 overflow-hidden rounded-[2rem] border bg-white/55 shadow-soft">
        <div className="bg-ink p-8 text-white">
          <span className="grid h-12 w-12 place-items-center rounded-2xl bg-accent">
            {icon}
          </span>
          <h2 className="display mt-6 text-2xl font-medium md:text-3xl">
            Integration-ready section
          </h2>
          <p className="mt-3 max-w-xl text-sm leading-6 text-white/50">
            The dashboard route, navigation and responsive layout are ready.
            Real records will be connected when the backend contract is
            available.
          </p>
        </div>
        <div className="p-7">
          <p className="text-xs font-bold uppercase tracking-wider text-black/35">
            Required backend support
          </p>
          <p className="mt-2 text-sm leading-6">{dependency}</p>
        </div>
      </div>
    </section>
  );
}
