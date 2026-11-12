import { Link } from 'react-router';
import { Check, TriangleAlert, X } from 'lucide-react';
import type { Claim } from '@contracts/types';
import { cn } from '@/lib/cn';
import { StatusBadge } from '@/components/common/status-badge';

/** Statement, Supports / Contradicts / Mentions counts, status, and decision usage (UI.md §4.8). */
export function ClaimCard({ claim, selected, onSelect }: { claim: Claim; selected: boolean; onSelect: () => void }) {
  const decisions = claim.used_by_decisions;
  const review = decisions.some((d) => d.review_state === 'needs_review');
  return (
    <article className={cn('relative rounded-card border bg-surface p-5 transition-colors', selected ? 'border-accent' : 'border-subtle hover:border-control', claim.status === 'candidate' && !selected && 'border-dashed')}>
      <h3 className="pr-24 text-base font-semibold text-fg">
        <button type="button" onClick={onSelect} aria-pressed={selected} className="text-left after:absolute after:inset-0 after:rounded-card after:content-['']">
          {claim.statement}
        </button>
      </h3>
      <StatusBadge status={claim.status} className="absolute top-5 right-5" />
      <p className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-sm">
        <span className="inline-flex items-center gap-1 text-knowledge">
          <Check aria-hidden="true" className="size-4" />
          {claim.supports_count} Supports
        </span>
        <span className={cn('inline-flex items-center gap-1', claim.contradicts_count ? 'text-danger' : 'text-fg-secondary')}>
          <X aria-hidden="true" className="size-4" />
          {claim.contradicts_count} Contradicts
        </span>
        <span className="text-fg-secondary">{claim.mentions_count} Mentions</span>
        {claim.has_new_contradiction ? <span className="rounded-badge border border-danger/60 px-1.5 text-xs font-medium text-danger">New contradiction</span> : null}
      </p>
      {decisions.length ? (
        <p className="relative mt-3 text-sm">
          <Link
            to={`/knowledge/memory?decision=${decisions[0].id}`}
            className={cn('inline-flex h-7 items-center gap-1.5 rounded-full border px-3 hover:text-fg', review ? 'border-warning/60 text-warning' : 'border-control text-fg-secondary')}
          >
            {review ? <TriangleAlert aria-hidden="true" className="size-3.5" /> : null}
            Used by {decisions.length} decision{decisions.length === 1 ? '' : 's'}
            {review ? <span className="sr-only"> — needs review</span> : null}
          </Link>
        </p>
      ) : null}
    </article>
  );
}
