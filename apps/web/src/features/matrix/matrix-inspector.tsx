import { Link } from 'react-router';
import { Check, SearchX, X } from 'lucide-react';
import type { MatrixCellPaper } from '@contracts/types';
import { confidenceLabel, formatConfidence } from '@/lib/format';
import { RELATION_LABEL } from '@/lib/relations';
import { evidenceHref } from '@/lib/evidence-link';
import { Button, ButtonLink } from '@/components/ui/button';
import { EvidencePassage } from '@/components/common/citation';
import { StatusBadge } from '@/components/common/status-badge';
import { EmptyState, ErrorState, LoadingSkeleton } from '@/components/common/states';
import { useToast } from '@/components/common/toast';
import { InspectorHeader } from '@/features/graph/relationship-inspector';
import { useMatrixCell, useReviewMatrixRelationship } from './use-matrix';

/** Evidence for the selected cell: papers, passages, status per relationship, Confirm/Reject (UI.md §4.7). */
export function MatrixInspector({ methodId, datasetId, includeCandidates, onClose }: { methodId: string | null; datasetId: string | null; includeCandidates: boolean; onClose: () => void }) {
  const { data: cell, isPending, error, refetch } = useMatrixCell(methodId, datasetId);
  if (!methodId || !datasetId) {
    return <EmptyState className="py-16" title="Select a cell" description="The inspector shows which papers tested that method on that dataset, with the passages that say so." />;
  }
  if (isPending) return <LoadingSkeleton className="p-6" rows={5} label="Loading evidence…" />;
  if (error) return <ErrorState className="m-6" error={error} onRetry={() => refetch()} />;
  const title = `${cell.method.name} × ${cell.dataset.name}`;
  const cellKey = `${cell.method.id}|${cell.dataset.id}`;
  // With "Include candidates" off, candidate papers don't fill the cell; they are listed separately for review.
  const counted = includeCandidates ? cell.papers : cell.papers.filter((p) => p.status === 'confirmed');
  const waiting = cell.papers.filter((p) => !counted.includes(p));
  return (
    <div className="flex h-full flex-col">
      <InspectorHeader title={title} onClose={onClose} />
      <div className="min-h-0 flex-1 overflow-y-auto px-6 py-5">
        {counted.length === 0 ? (
          <div role="status" className="rounded-card border border-dashed border-control p-5">
            <p className="flex items-center gap-2 font-semibold text-fg">
              <SearchX aria-hidden="true" className="size-5 text-fg-muted" />
              No evidence in your collection
            </p>
            <p className="mt-2 text-sm text-fg-secondary">
              None of your papers report {cell.method.name} on {cell.dataset.name}. This is a gap in your collection, not proof that nobody has tested it.
            </p>
            <p className="mt-3 text-sm text-fg-muted">Finding papers for a gap is coming later. ORIVANA only searches papers you added.</p>
          </div>
        ) : (
          <>
            <p className="text-sm text-fg-secondary">
              {counted.length} paper{counted.length === 1 ? '' : 's'} in your collection tested {cell.method.name} on {cell.dataset.name}.
            </p>
            <ul className="mt-4 flex flex-col gap-4">
              {counted.map((p) => (
                <PaperEvidence key={p.source_id} paper={p} cellKey={cellKey} />
              ))}
            </ul>
          </>
        )}
        {waiting.length ? (
          <section aria-labelledby="matrix-waiting" className="mt-6">
            <h3 id="matrix-waiting" className="text-sm font-medium text-fg">
              Candidate evidence · not counted yet
            </h3>
            <p className="mt-1 text-sm text-fg-secondary">Extraction suggests {waiting.length === 1 ? 'this paper' : 'these papers'} might fill the cell. Confirm to count it, or turn on Include candidates.</p>
            <ul className="mt-3 flex flex-col gap-4">
              {waiting.map((p) => (
                <PaperEvidence key={p.source_id} paper={p} cellKey={cellKey} />
              ))}
            </ul>
          </section>
        ) : null}
        {cell.related_claim_ids.length ? (
          <ButtonLink to={`/knowledge/claims?claim=${cell.related_claim_ids[0]}`} className="mt-6">
            Open in Claims
          </ButtonLink>
        ) : null}
      </div>
    </div>
  );
}

function PaperEvidence({ paper, cellKey }: { paper: MatrixCellPaper; cellKey: string }) {
  const review = useReviewMatrixRelationship();
  const toast = useToast();
  const pending = paper.relationships.filter((r) => r.status === 'candidate');
  const decide = (status: 'confirmed' | 'rejected') => {
    for (const rel of pending) {
      review.mutate({ id: rel.id, status }, { onSuccess: () => toast.success(status === 'confirmed' ? 'Relationship confirmed' : 'Relationship rejected'), onError: (e) => toast.error(e.message) });
    }
  };
  return (
    <li className="rounded-card border border-subtle bg-surface p-4">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <p className="text-base font-semibold text-fg">
          <span className="mr-2 inline-flex h-6 min-w-6 items-center justify-center rounded-badge border border-accent/50 bg-accent/10 px-1.5 text-xs text-accent tabular">{paper.ordinal}</span>
          {paper.label}
        </p>
        <StatusBadge status={paper.status} />
      </div>
      <ul className="mt-3 flex flex-col gap-1 text-sm text-fg-secondary">
        {paper.relationships.map((r) => (
          <li key={r.id} className="flex flex-wrap items-center gap-2">
            {RELATION_LABEL[r.relation_type]} · {r.confidence === null ? 'set by you' : `${formatConfidence(r.confidence)} ${confidenceLabel(r.confidence).toLowerCase()}`}
            {r.status === 'candidate' ? <StatusBadge status="candidate" /> : null}
          </li>
        ))}
      </ul>
      {paper.evidence.slice(0, 2).map((ev) => (
        <div key={ev.id} className="mt-3 border-t border-subtle pt-3">
          <p className="text-sm text-fg-secondary">
            p. {ev.page} · §{ev.section}
          </p>
          <EvidencePassage className="mt-1 text-sm" passage={ev.passage} start={ev.char_start} end={ev.char_end} />
          <Link to={evidenceHref(ev, { href: `/knowledge/matrix?cell=${encodeURIComponent(cellKey)}`, label: 'the Matrix' })} className="mt-2 inline-block text-sm text-accent underline underline-offset-4 hover:text-fg">
            Open in document · p. {ev.page}
          </Link>
        </div>
      ))}
      {pending.length ? (
        <div className="mt-4 grid grid-cols-2 gap-2">
          <Button variant="primary" size="sm" onClick={() => decide('confirmed')} loading={review.isPending && review.variables?.status === 'confirmed'} loadingText="Confirming…" disabled={review.isPending}>
            <Check aria-hidden="true" />
            Confirm
          </Button>
          <Button variant="danger" size="sm" onClick={() => decide('rejected')} loading={review.isPending && review.variables?.status === 'rejected'} loadingText="Rejecting…" disabled={review.isPending}>
            <X aria-hidden="true" />
            Reject
          </Button>
        </div>
      ) : null}
    </li>
  );
}
