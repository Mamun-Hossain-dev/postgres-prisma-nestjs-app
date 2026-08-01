import { forwardRef, type InputHTMLAttributes, type ReactNode } from 'react';
import { cn } from '@/lib/utils';

export function Field({
  label,
  error,
  hint,
  children,
}: {
  label: string;
  error?: string;
  hint?: string;
  children: ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-bold">{label}</span>
      {children}
      {error ? (
        <span
          className="mt-1.5 block text-xs font-medium text-red-600"
          role="alert"
        >
          {error}
        </span>
      ) : hint ? (
        <span className="mt-1.5 block text-xs text-black/45">{hint}</span>
      ) : null}
    </label>
  );
}

export const Input = forwardRef<
  HTMLInputElement,
  InputHTMLAttributes<HTMLInputElement>
>(({ className, ...props }, ref) => (
  <input
    ref={ref}
    className={cn(
      'h-14 w-full rounded-2xl border bg-white/65 px-4 text-[15px] text-ink shadow-sm transition duration-200 placeholder:text-black/30 hover:border-black/20 focus:border-accent focus:bg-white focus:outline-none focus:ring-4 focus:ring-accent/10 aria-[invalid=true]:border-red-500 aria-[invalid=true]:ring-red-500/10 disabled:cursor-not-allowed disabled:opacity-50',
      className,
    )}
    {...props}
  />
));
Input.displayName = 'Input';
