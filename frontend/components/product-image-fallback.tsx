import {
  Cable,
  Headphones,
  Laptop,
  Smartphone,
  Tablet,
  Watch,
} from 'lucide-react';
import type { Product } from '@/lib/types';
import { cn } from '@/lib/utils';

const visuals: Record<
  Product['category'],
  { icon: typeof Smartphone; label: string }
> = {
  MOBILE: { icon: Smartphone, label: 'Smartphone' },
  LAPTOP: { icon: Laptop, label: 'Laptop' },
  TABLET: { icon: Tablet, label: 'Tablet' },
  AUDIO: { icon: Headphones, label: 'Audio device' },
  WATCH: { icon: Watch, label: 'Smart watch' },
  ACCESSORY: { icon: Cable, label: 'Device accessory' },
};

export function ProductImageFallback({
  category,
  className,
}: {
  category: Product['category'];
  className?: string;
}) {
  const { icon: Icon, label } = visuals[category];

  return (
    <div
      role="img"
      aria-label={`${label} image placeholder`}
      className={cn('absolute inset-0 grid place-items-center', className)}
    >
      <div className="absolute h-2/3 w-2/3 rounded-full bg-white/25 blur-3xl" />
      <div className="relative grid h-[54%] w-[48%] place-items-center rounded-[2rem] border border-white/60 bg-ink/95 text-white shadow-2xl transition duration-500 group-hover:scale-105">
        <div className="absolute inset-2 rounded-[1.5rem] bg-gradient-to-br from-white/15 to-transparent" />
        <Icon className="relative h-2/5 w-2/5 stroke-[1.35] text-white/85" />
        <span className="absolute bottom-5 text-[9px] font-bold uppercase tracking-[0.24em] text-white/40">
          {label}
        </span>
      </div>
    </div>
  );
}
