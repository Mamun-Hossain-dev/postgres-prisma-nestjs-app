import { forwardRef, type ButtonHTMLAttributes } from 'react';
import { LoaderCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

type Variant = 'primary' | 'secondary' | 'outline' | 'danger' | 'ghost';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  loading?: boolean;
}

const variants: Record<Variant, string> = {
  primary: 'bg-ink text-white hover:bg-accent',
  secondary: 'bg-accent text-white hover:bg-[#bd5630]',
  outline: 'border bg-white/50 hover:border-ink hover:bg-white',
  danger: 'bg-red-600 text-white hover:bg-red-700',
  ghost: 'hover:bg-black/5',
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    { className, variant = 'primary', loading, disabled, children, ...props },
    ref,
  ) => (
    <button
      ref={ref}
      disabled={disabled || loading}
      className={cn(
        'inline-flex h-11 items-center justify-center gap-2 rounded-full px-5 text-sm font-bold transition duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50',
        variants[variant],
        className,
      )}
      {...props}
    >
      {loading && (
        <LoaderCircle className="animate-spin" size={17} aria-hidden />
      )}
      {children}
    </button>
  ),
);
Button.displayName = 'Button';
