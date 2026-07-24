import Link from 'next/link';
import { ArrowLeft, Sparkles } from 'lucide-react';

export function AuthShell({
  eyebrow,
  title,
  intro,
  children,
  footer,
}: {
  eyebrow: string;
  title: string;
  intro: string;
  children: React.ReactNode;
  footer: React.ReactNode;
}) {
  return (
    <div className="grid min-h-[calc(100vh-5rem)] lg:grid-cols-2">
      <div className="relative hidden overflow-hidden bg-ink p-12 text-white lg:flex lg:flex-col lg:justify-between">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_75%_25%,#a86747_0,transparent_33%),radial-gradient(circle_at_15%_85%,#485041_0,transparent_35%)] opacity-70" />
        <Link href="/" className="relative flex items-center gap-2 text-sm text-white/65">
          <ArrowLeft size={17} /> Back to DeviceDock
        </Link>
        <div className="relative max-w-lg">
          <Sparkles className="mb-8 text-[#ddae89]" />
          <blockquote className="display text-5xl leading-tight">
            “Technology should feel useful before it feels impressive.”
          </blockquote>
          <p className="mt-7 text-sm uppercase tracking-[0.2em] text-white/45">
            The DeviceDock principle
          </p>
        </div>
      </div>
      <div className="flex items-center justify-center px-5 py-16">
        <div className="w-full max-w-md">
          <p className="text-xs font-bold uppercase tracking-[0.22em] text-accent">
            {eyebrow}
          </p>
          <h1 className="display mt-3 text-5xl sm:text-6xl">{title}</h1>
          <p className="mt-4 leading-7 text-black/50">{intro}</p>
          <div className="mt-9">{children}</div>
          <div className="mt-7 text-center text-sm text-black/50">{footer}</div>
        </div>
      </div>
    </div>
  );
}
