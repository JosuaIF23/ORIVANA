import { useState } from 'react';
import { Link } from 'react-router';
import { Check, X } from 'lucide-react';
import type { DecisionHistoryEntry } from '@contracts/types';
import { formatDate, formatTime } from '@/lib/format';
import { Button, ButtonLink } from '@/components/ui/button';
import { Sheet } from '@/components/ui/sheet';
import { ReviewStateBadge } from '@/components/common/review-state-badge';
import { OriginBadge, StatusBadge } from '@/components/common/status-badge';
import { ErrorState, InlineAlert, LoadingSkeleton } from '@/components/common/states';
import { DependenciesDialog } from './dependencies-dialog';
import { useDecision } from './use-decisions';

const HISTORY_HREF: Record<string, (id: string) => string> = {
  memory: (id) => `/knowledge/memory?decision=${id}`,
  decision_alert: (id) => `/decision-alerts/${id}`,
  proposal: (id) => `/approvals/${id}`,
  source: (id) => `/knowledge/sources/${id}`,
};

/** Decision detail side sheet (UI.md §4.10): statement, rationale, dependencies, evidence, history. */
export function DecisionSheet({ id, onClose }: { id: string | null; onClose: () => void }) {
  const { data: d, isPending, error, refetch } = useDecision(id);
  const [editingDeps, setEditingDeps] = useState(false);
  const title = d ? `${d.decision?.code ? `${d.decision.code} · ` : ''}${d.title ?? d.content}` : 'Decision';

  return (
    <Sheet open={Boolean(id)} onOpenChange={(o) => !o && onClose()} title={title} description={d?.project_name ?? undefined}>
      {isPending ? (
        <LoadingSkeleton rows={6} label="Loading decision…" />
      ) : error ? (
        <ErrorState error={error} onRetry={() => refetch()} />
      ) : (
        <div className="flex flex-col gap-6">
          <div className="flex flex-wrap gap-2">
            <StatusBadge status={d.status} size="md" />
            <ReviewStateBadge state={d.review_state} />
            <OriginBadge origin={d.origin} />
          </div>
          {d.open_alert_id ? (
            <InlineAlert tone="warning" title="A new paper contradicts a claim this decision depends on.">
              <ButtonLink to={`/decision-alerts/${d.open_alert_id}`} size="sm" variant="primary" className="mt-3">
                Review decision
              </ButtonLink>
            </InlineAlert>
          ) : null}
          <section aria-labelledby="dec-statement">
            <h3 id="dec-statement" className="text-sm font-medium text-fg-secondary">Statement</h3>
            <p className="mt-1 text-base text-fg">{d.content}</p>
            <h3 className="mt-4 text-sm font-medium text-fg-secondary">Rationale</h3>
            <p className="mt-1 text-base text-fg">{d.rationale ?? d.decision?.rationale ?? <span className="text-fg-muted">No rationale recorded.</span>}</p>
          </section>
          <section aria-labelledby="dec-deps">
            <div className="flex items-center justify-between gap-3">
              <h3 id="dec-deps" className="text-sm font-medium text-fg-secondary">
                Depends on · {d.dependencies?.length ?? 0} claim{d.dependencies?.length === 1 ? '' : 's'}
              </h3>
              <Button variant="ghost" size="sm" onClick={() => setEditingDeps(true)} disabled={d.status === 'superseded'}>
                Edit dependencies
              </Button>
            </div>
            {d.dependencies?.length ? (
              <ul className="mt-2 flex flex-col gap-2">
                {d.dependencies.map((dep) => (
                  <li key={dep.claim_id} className="rounded-card border border-subtle bg-surface p-3">
                    <Link to={`/knowledge/claims?claim=${dep.claim_id}`} className="text-sm text-fg underline-offset-4 hover:underline">
                      {dep.statement}
                    </Link>
                    <p className="mt-1 flex gap-3 text-xs">
                      <span className="inline-flex items-center gap-1 text-knowledge"><Check aria-hidden="true" className="size-3.5" />{dep.supports_count} Supports</span>
                      <span className={`inline-flex items-center gap-1 ${dep.contradicts_count ? 'text-danger' : 'text-fg-secondary'}`}><X aria-hidden="true" className="size-3.5" />{dep.contradicts_count} Contradicts</span>
                    </p>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-2 text-sm text-fg-muted">No claims linked. Decision Impact can only watch decisions that depend on claims.</p>
            )}
          </section>
          <section aria-labelledby="dec-evidence">
            <h3 id="dec-evidence" className="text-sm font-medium text-fg-secondary">Evidence</h3>
            {d.decision?.evidence.length ? (
              <ul className="mt-2 flex flex-col gap-1 text-sm">
                {d.decision.evidence.map((e) => (
                  <li key={`${e.source_id}-${e.page}`}>
                    <Link to={`/knowledge/sources/${e.source_id}?page=${e.page}`} className="text-accent underline underline-offset-4 hover:text-fg">
                      {e.label} · p. {e.page}
                    </Link>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-2 text-sm text-fg-muted">No evidence passages linked.</p>
            )}
          </section>
          <HistoryList entries={d.history ?? []} />
          <DependenciesDialog key={`${d.id}-${d.updated_at}`} decision={d} open={editingDeps} onOpenChange={setEditingDeps} />
        </div>
      )}
    </Sheet>
  );
}

function HistoryList({ entries }: { entries: DecisionHistoryEntry[] }) {
  return (
    <section aria-labelledby="dec-history">
      <h3 id="dec-history" className="text-sm font-medium text-fg-secondary">History</h3>
      <ol className="mt-2 border-l border-subtle pl-4">
        {entries.toReversed().map((h, i) => (
          <li key={`${h.at}-${i}`} className="relative pb-3 text-sm before:absolute before:top-1.5 before:-left-[21px] before:size-2 before:rounded-full before:bg-control">
            <time dateTime={h.at} className="text-fg-secondary">
              {formatDate(h.at)} · {formatTime(h.at)}
            </time>
            <p className={h.kind === 'alert_raised' ? 'text-warning' : 'text-fg'}>
              {h.link ? (
                <Link to={HISTORY_HREF[h.link.target_type](h.link.target_id)} className="underline-offset-4 hover:underline">
                  {h.text}
                </Link>
              ) : (
                h.text
              )}
            </p>
          </li>
        ))}
      </ol>
    </section>
  );
}
