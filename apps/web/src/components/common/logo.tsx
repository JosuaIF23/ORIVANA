import { cn } from '@/lib/cn';

/** Connected paths converging into an arrow: knowledge → intent → action. */
export function LogoMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" fill="none" aria-hidden="true" className={cn('size-7', className)}>
      <circle cx="7" cy="8" r="2.75" className="stroke-accent" strokeWidth="2" />
      <circle cx="7" cy="24" r="2.75" className="stroke-accent" strokeWidth="2" />
      <path d="M9 10.5 14 16l-5 5.5" className="stroke-accent" strokeWidth="2" strokeLinecap="round" />
      <circle cx="16" cy="16" r="2.75" className="fill-knowledge" />
      <path d="M19 16h8.5M24 12.5l3.5 3.5-3.5 3.5" className="stroke-accent" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function Logo({ className, compact = false }: { className?: string; compact?: boolean }) {
  return (
    <span className={cn('inline-flex items-center gap-3', className)}>
      <LogoMark />
      {compact ? <span className="sr-only">ORIVANA</span> : <span className="text-base font-semibold tracking-[0.22em] text-fg">ORIVANA</span>}
    </span>
  );
}
