import type { ReactNode } from 'react';
import { CircleAlert, CircleCheck, Info, TriangleAlert } from 'lucide-react';
import { cn } from '@/lib/cn';
import { isApiError } from '@/services/core/http';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/primitives';

export function EmptyState({ icon, title, description, action, className }: { icon?: ReactNode; title: ReactNode; description?: ReactNode; action?: ReactNode; className?: string }) {
  return (
    <div role="status" className={cn('flex flex-col items-center px-6 py-12 text-center', className)}>
      {icon ? <div className="mb-4 text-knowledge [&_svg]:size-8">{icon}</div> : null}
      <h2 className="text-lg font-semibold text-fg">{title}</h2>
      {description ? <p className="mt-2 max-w-md text-base text-fg-secondary">{description}</p> : null}
      {action ? <div className="mt-6">{action}</div> : null}
    </div>
  );
}

/** Recoverable error with the request id, so support can trace it. */
export function ErrorState({ error, title = 'This didn’t load', onRetry, className }: { error: unknown; title?: string; onRetry?: () => void; className?: string }) {
  const message = isApiError(error) ? error.error.message : 'Something went wrong. Try again.';
  const requestId = isApiError(error) ? error.error.request_id : null;
  return (
    <div role="alert" className={cn('flex flex-col items-start gap-3 rounded-card border border-danger/40 bg-danger/5 p-5', className)}>
      <div className="flex items-start gap-3">
        <CircleAlert aria-hidden="true" className="mt-0.5 size-5 shrink-0 text-danger" />
        <div>
          <p className="font-semibold text-fg">{title}</p>
          <p className="mt-1 text-sm text-fg-secondary">{message}</p>
          {requestId ? <p className="mt-1 font-mono text-xs text-fg-muted">Request {requestId}</p> : null}
        </div>
      </div>
      {onRetry ? (
        <Button size="sm" onClick={onRetry}>
          Try again
        </Button>
      ) : null}
    </div>
  );
}

/** Skeleton rows with an accessible label. */
export function LoadingSkeleton({ rows = 4, label = 'Loading…', className }: { rows?: number; label?: string; className?: string }) {
  return (
    <div role="status" aria-busy="true" className={cn('flex flex-col gap-3', className)}>
      {Array.from({ length: rows }, (_, i) => (
        <div key={i} className="flex items-center gap-4">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-4 flex-1" />
          <Skeleton className="h-6 w-20" />
        </div>
      ))}
      <span className="mt-2 text-sm text-fg-muted">{label}</span>
    </div>
  );
}

type AlertTone = 'info' | 'warning' | 'danger' | 'success';

const ALERT: Record<AlertTone, { icon: ReactNode; cls: string }> = {
  info: { icon: <Info className="text-accent" />, cls: 'border-accent/40 bg-accent/5' },
  warning: { icon: <TriangleAlert className="text-warning" />, cls: 'border-warning/50 bg-warning/5' },
  danger: { icon: <CircleAlert className="text-danger" />, cls: 'border-danger/50 bg-danger/5' },
  success: { icon: <CircleCheck className="text-knowledge" />, cls: 'border-knowledge/50 bg-knowledge/5' },
};

export function InlineAlert({ tone = 'info', title, children, icon, className, live = false }: { tone?: AlertTone; title?: ReactNode; children?: ReactNode; icon?: ReactNode; className?: string; live?: boolean }) {
  const def = ALERT[tone];
  return (
    <div role={live ? (tone === 'danger' ? 'alert' : 'status') : undefined} className={cn('flex gap-3 rounded-card border p-4', def.cls, className)}>
      <span aria-hidden="true" className="mt-0.5 shrink-0 [&_svg]:size-5">
        {icon ?? def.icon}
      </span>
      <div className="min-w-0 text-sm">
        {title ? <p className="font-semibold text-fg">{title}</p> : null}
        {children ? <div className={cn('text-fg-secondary', title && 'mt-1')}>{children}</div> : null}
      </div>
    </div>
  );
}
