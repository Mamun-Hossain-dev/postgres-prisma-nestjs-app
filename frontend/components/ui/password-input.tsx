'use client';

import { forwardRef, useState, type InputHTMLAttributes } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { cn } from '@/lib/utils';

export const PasswordInput = forwardRef<
  HTMLInputElement,
  InputHTMLAttributes<HTMLInputElement>
>(({ className, ...props }, ref) => {
  const [visible, setVisible] = useState(false);

  return (
    <div className="relative">
      <input
        ref={ref}
        type={visible ? 'text' : 'password'}
        className={cn(
          'h-14 w-full rounded-2xl border bg-white/60 px-4 pr-12 transition placeholder:text-black/30 focus:border-accent focus:outline-none focus:ring-4 focus:ring-accent/10',
          className,
        )}
        {...props}
      />
      <button
        type="button"
        onClick={() => setVisible((current) => !current)}
        className="absolute right-2 top-1/2 grid h-10 w-10 -translate-y-1/2 place-items-center rounded-xl text-black/45 hover:bg-black/5 focus-visible:ring-2 focus-visible:ring-accent"
        aria-label={visible ? 'Hide password' : 'Show password'}
      >
        {visible ? <EyeOff size={18} /> : <Eye size={18} />}
      </button>
    </div>
  );
});
PasswordInput.displayName = 'PasswordInput';

export function PasswordStrength({ password }: { password: string }) {
  const checks = [
    password.length >= 8,
    /[A-Z]/.test(password) && /[a-z]/.test(password),
    /\d/.test(password),
    /[^A-Za-z0-9]/.test(password),
  ];
  const score = checks.filter(Boolean).length;
  const labels = ['Very weak', 'Weak', 'Fair', 'Good', 'Strong'];

  return (
    <div className="mt-2" aria-live="polite">
      <div className="grid grid-cols-4 gap-1">
        {checks.map((passed, index) => (
          <span
            key={index}
            className={cn(
              'h-1 rounded-full transition',
              index < score
                ? score >= 3
                  ? 'bg-emerald-500'
                  : 'bg-amber-500'
                : 'bg-black/10',
            )}
          />
        ))}
      </div>
      <p className="mt-1.5 text-[11px] text-black/45">
        Strength: <span className="font-bold">{labels[score]}</span>
      </p>
    </div>
  );
}
