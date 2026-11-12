import type { ReactNode } from 'react';
import { cn } from '@/lib/cn';

/** Page title (the only h1 on the page), optional context and actions. */
export function PageHeader({ title, context, description, actions, className }: { title: ReactNode; context?: ReactNode; description?: ReactNode; actions?: ReactNode; className?: string }) {
  return (
    <header className={cn('flex flex-wrap items-start justify-between gap-4', className)}>
      <div className="min-w-0">
        <div className="flex flex-wrap items-baseline gap-x-4 gap-y-1">
          <h1 className="text-xl font-semibold text-fg">{title}</h1>
          {context ? <span className="text-sm text-fg-secondary">{context}</span> : null}
        </div>
        {description ? <p className="mt-1 max-w-3xl text-base text-fg-secondary">{description}</p> : null}
      </div>
      {actions ? <div className="flex shrink-0 flex-wrap items-center gap-3">{actions}</div> : null}
    </header>
  );
}
