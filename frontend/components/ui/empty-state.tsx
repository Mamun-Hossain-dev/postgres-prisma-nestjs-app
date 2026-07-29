import type { ReactNode } from 'react';

export function EmptyState({
  icon,
  title,
  description,
  action,
}: {
  icon?: ReactNode;
  title: string;
  description: string;
  action?: ReactNode;
}) {
  return (
    <div className="grid min-h-72 place-items-center px-6 py-14 text-center">
      <div className="max-w-sm">
        {icon && (
          <span className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-black/5 text-black/45">
            {icon}
          </span>
        )}
        <h2 className="display mt-5 text-3xl">{title}</h2>
        <p className="mt-2 text-sm leading-6 text-black/50">{description}</p>
        {action && <div className="mt-6">{action}</div>}
      </div>
    </div>
  );
}
