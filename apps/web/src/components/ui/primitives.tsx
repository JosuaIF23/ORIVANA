import type { HTMLAttributes, ReactNode } from 'react';
import { cn } from '@/lib/cn';

/** Card surface: bg-surface, subtle border, 8 px radius. */
export function Card({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('rounded-card border border-subtle bg-surface', className)} {...props} />;
}

export function Kbd({ children, className }: { children: ReactNode; className?: string }) {
  return <kbd className={cn('inline-flex h-6 min-w-6 items-center justify-center rounded-badge border border-subtle bg-surface px-1.5 font-sans text-xs text-fg-secondary', className)}>{children}</kbd>;
}

export function Skeleton({ className }: { className?: string }) {
  return <div aria-hidden="true" className={cn('animate-pulse rounded-control bg-elevated/70', className)} />;
}

/** Plain heading for a card or section. */
export function SectionTitle({ as: Tag = 'h2', children, className }: { as?: 'h2' | 'h3'; children: ReactNode; className?: string }) {
  return <Tag className={cn('text-lg font-semibold text-fg', className)}>{children}</Tag>;
}

/** Definition list for metadata rows (label / value). */
export function MetaList({ rows, className, labelWidth = 'w-28' }: { rows: Array<[ReactNode, ReactNode]>; className?: string; labelWidth?: string }) {
  return (
    <dl className={cn('grid gap-2 text-sm', className)}>
      {rows.map(([label, value], i) => (
        <div key={i} className="flex gap-3">
          <dt className={cn('shrink-0 text-fg-muted', labelWidth)}>{label}</dt>
          <dd className="min-w-0 text-fg">{value}</dd>
        </div>
      ))}
    </dl>
  );
}
