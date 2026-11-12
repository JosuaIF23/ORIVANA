import { TriangleAlert } from 'lucide-react';
import type { ReviewState } from '@contracts/types';
import { cn } from '@/lib/cn';

/** "Needs review" with an alert-triangle icon (UI.md §2.3). Renders nothing when the state is ok. */
export function ReviewStateBadge({ state, className }: { state: ReviewState | undefined; className?: string }) {
  if (state !== 'needs_review') return null;
  return (
    <span className={cn('inline-flex h-6 shrink-0 items-center gap-1.5 rounded-badge border border-warning/60 bg-warning/10 px-2 text-xs font-medium whitespace-nowrap text-warning', className)}>
      <TriangleAlert aria-hidden="true" className="size-3.5" />
      Needs review
    </span>
  );
}
