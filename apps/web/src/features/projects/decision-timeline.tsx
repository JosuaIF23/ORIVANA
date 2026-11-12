import { useState } from 'react';
import { Link } from 'react-router';
import { ArrowRightToLine, LoaderPinwheel } from 'lucide-react';
import type { Memory } from '@contracts/types';
import { cn } from '@/lib/cn';
import { formatDate } from '@/lib/format';
import { Button } from '@/components/ui/button';
import { OriginBadge, StatusBadge } from '@/components/common/status-badge';
import { ReviewStateBadge } from '@/components/common/review-state-badge';
import { EmptyState, LoadingSkeleton } from '@/components/common/states';
import { useToast } from '@/components/common/toast';
import { useUpdateMemory } from '@/features/memory/use-memory';
import { MemoryFormDialog } from '@/features/memory/memory-dialogs';

/** Decisions latest first; superseded ones are struck through with a link to the replacement. */
export function DecisionTimeline({ decisions, loading }: { decisions: Memory[] | null; loading: boolean }) {
  const sorted = (decisions ?? []).filter((d) => d.status !== 'rejected').toSorted((a, b) => b.created_at.localeCompare(a.created_at));
  const byId = new Map(sorted.map((d) => [d.id, d]));
  return (
    <section aria-labelledby="timeline-title">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 id="timeline-title" className="text-lg font-semibold text-fg">
          Decision timeline
        </h2>
        <p className="text-sm text-fg-secondary">Latest first · superseded decisions stay in history</p>
      </div>
      {loading ? (
        <LoadingSkeleton className="mt-4" rows={4} label="Loading decisions…" />
      ) : sorted.length === 0 ? (
        <EmptyState title="No decisions yet" description="Decisions you confirm in conversations appear here with their evidence." />
      ) : (
        <ol className="mt-5 flex flex-col">
          {sorted.map((d, i) => (
            <TimelineItem key={d.id} decision={d} last={i === sorted.length - 1} replacement={d.superseded_by_id ? byId.get(d.superseded_by_id) : undefined} superseded={d.supersedes_id ? byId.get(d.supersedes_id) : undefined} />
          ))}
        </ol>
      )}
    </section>
  );
}

function Marker({ status }: { status: Memory['status'] }) {
  if (status === 'candidate' || status === 'proposed') return <LoaderPinwheel aria-hidden="true" className="size-4 text-warning" />;
  if (status === 'superseded') return <span aria-hidden="true" className="block size-3 rounded-full border-2 border-fg-secondary bg-app" />;
  return <span aria-hidden="true" className="block size-3 rounded-full bg-knowledge" />;
}

function TimelineItem({ decision: d, last, replacement, superseded }: { decision: Memory; last: boolean; replacement?: Memory; superseded?: Memory }) {
  const update = useUpdateMemory();
  const toast = useToast();
  const [editing, setEditing] = useState(false);
  const proposed = d.status === 'candidate' || d.status === 'proposed';
  const act = (op: 'confirm' | 'reject') => update.mutate({ id: d.id, request: { op } }, { onSuccess: () => toast.success(op === 'confirm' ? `${d.decision?.code} confirmed` : `${d.decision?.code} rejected`), onError: (e) => toast.error(e.message) });
  return (
    <li className="grid grid-cols-[96px_24px_minmax(0,1fr)] gap-x-3">
      <time dateTime={d.created_at} className="pt-5 text-right text-sm text-fg-secondary">{formatDate(d.created_at)}</time>
      <div className="flex flex-col items-center">
        <span className="mt-6 flex size-4 items-center justify-center"><Marker status={d.status} /></span>
        {!last ? <span aria-hidden="true" className="w-px flex-1 bg-control" /> : null}
      </div>
      <article id={d.id} className={cn('mb-4 scroll-mt-24 rounded-card border bg-surface p-5', proposed ? 'border-dashed border-warning/70' : d.review_state === 'needs_review' && d.status !== 'superseded' ? 'border-warning/60' : 'border-subtle')}>
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-mono text-xs text-fg-secondary">{d.decision?.code}</span>
          <StatusBadge status={proposed ? 'proposed' : d.status} />
          {d.status !== 'superseded' ? <OriginBadge origin={d.origin} /> : null}
          <ReviewStateBadge state={d.status === 'superseded' ? 'ok' : d.review_state} />
          {d.open_alert_id ? (
            <Link to={`/decision-alerts/${d.open_alert_id}`} className="ml-auto text-sm font-medium text-accent underline underline-offset-4 hover:text-fg">
              Review
            </Link>
          ) : null}
        </div>
        <h3 className={cn('mt-3 text-lg font-semibold', d.status === 'superseded' ? 'text-fg-secondary line-through' : 'text-fg')}>{d.title ?? d.decision?.title}</h3>
        {d.decision?.rationale ? (
          <p className="mt-2 text-base text-fg-secondary">
            <strong className="font-semibold text-fg">Rationale:</strong> {d.decision.rationale}
          </p>
        ) : null}
        {d.decision?.evidence.length ? (
          <p className="mt-3 flex flex-wrap items-center gap-2 text-sm text-fg-secondary">
            Evidence
            {d.decision.evidence.map((ev) => (
              <Link key={`${ev.source_id}-${ev.page}`} to={`/knowledge/sources/${ev.source_id}?page=${ev.page}`} className="rounded-full border border-control px-3 py-1 text-sm text-fg hover:border-fg-muted">
                {ev.label} · p. {ev.page}
              </Link>
            ))}
          </p>
        ) : null}
        {superseded ? (
          <p className="mt-3 flex items-center gap-2 text-sm text-fg-secondary">
            <ArrowRightToLine aria-hidden="true" className="size-4" />
            Supersedes <a href={`#${superseded.id}`} className="text-accent underline underline-offset-4">{superseded.decision?.code} {superseded.decision?.title}</a>
          </p>
        ) : null}
        {d.status === 'superseded' && replacement ? (
          <p className="mt-2 text-sm text-fg-secondary">
            Superseded on {formatDate(d.valid_to ?? d.updated_at).replace(/ \d{4}$/, '')} by <a href={`#${replacement.id}`} className="text-accent underline underline-offset-4">{replacement.decision?.code} · {replacement.decision?.title}</a>
          </p>
        ) : null}
        {proposed ? (
          <div className="mt-4 flex flex-wrap gap-3">
            <Button onClick={() => act('confirm')} loading={update.isPending && update.variables?.request.op === 'confirm'} loadingText="Confirming…" disabled={update.isPending}>
              Confirm decision
            </Button>
            <Button variant="ghost" onClick={() => setEditing(true)}>
              Edit
            </Button>
            <Button variant="ghost" className="text-danger hover:text-danger" onClick={() => act('reject')} disabled={update.isPending}>
              Reject
            </Button>
          </div>
        ) : null}
        {editing ? <MemoryFormDialog memory={d} open onOpenChange={setEditing} /> : null}
      </article>
    </li>
  );
}
