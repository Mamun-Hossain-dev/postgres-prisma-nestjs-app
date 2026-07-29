import type { ReactNode } from 'react';

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
      <p className="text-xs font-bold uppercase tracking-[0.22em] text-accent">
        {eyebrow}
      </p>
      <h1 className="display mt-2 text-5xl sm:text-6xl">{title}</h1>
      <p className="mt-4 max-w-2xl leading-7 text-black/50">{description}</p>
      <div className="mt-9 overflow-hidden rounded-[2rem] border bg-white/55 shadow-soft">
        <div className="bg-ink p-8 text-white">
          <span className="grid h-12 w-12 place-items-center rounded-2xl bg-accent">
            {icon}
          </span>
          <h2 className="display mt-6 text-3xl">Integration-ready section</h2>
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
