import { Link } from 'react-router';
import { ArrowDown, Check, X } from 'lucide-react';
import { confidenceLabel, formatConfidence, formatDate, plural } from '@/lib/format';
import { relationVerb } from '@/lib/relations';
import { Button } from '@/components/ui/button';
import { MetaList } from '@/components/ui/primitives';
import { EvidencePassage } from '@/components/common/citation';
import { EntityTypeIcon } from '@/components/common/entity-icon';
import { OriginBadge, StatusBadge } from '@/components/common/status-badge';
import { ErrorState, LoadingSkeleton } from '@/components/common/states';
import { useToast } from '@/components/common/toast';
import { useRelationship, useReviewRelationship } from './use-graph';

/** Selected edge: endpoints, status, provenance, evidence, Confirm/Reject (UI.md §4.6). */
export function RelationshipInspector({ id, onClose }: { id: string; onClose: () => void }) {
  const { data: rel, isPending, error, refetch } = useRelationship(id);
  const review = useReviewRelationship();
  const toast = useToast();
  if (isPending) return <LoadingSkeleton className="p-6" rows={5} label="Loading relationship…" />;
  if (error) return <ErrorState className="m-6" error={error} onRetry={() => refetch()} />;

  const decide = (status: 'confirmed' | 'rejected') =>
    review.mutate({ id: rel.id, status }, { onSuccess: () => toast.success(status === 'confirmed' ? 'Relationship confirmed' : 'Relationship rejected'), onError: (e) => toast.error(e.message) });

  return (
    <div className="flex h-full flex-col">
      <InspectorHeader title="Relationship" onClose={onClose} />
      <div className="min-h-0 flex-1 overflow-y-auto px-6 py-5">
        <p className="inline-flex items-center gap-2 rounded-control border border-control bg-surface px-3 py-2 text-base text-fg">
          <EntityTypeIcon type={rel.from.entity_type} />
          {rel.from.canonical_name}
        </p>
        <p className="my-2 flex items-center gap-2 pl-3 text-sm font-semibold tracking-wide text-accent">
          <ArrowDown aria-hidden="true" className="size-4" />
          {rel.relation_type.toUpperCase()}
          <span className="sr-only">({relationVerb(rel.relation_type)})</span>
        </p>
        <p className="inline-flex items-center gap-2 rounded-control border border-control bg-surface px-3 py-2 text-base text-fg">
          <EntityTypeIcon type={rel.to.entity_type} />
          {rel.to.canonical_name}
        </p>
        <div className="mt-5 flex flex-wrap gap-2">
          <StatusBadge status={rel.status} size="md" />
          <OriginBadge origin={rel.origin} />
        </div>
        <MetaList
          className="mt-5"
          rows={[
            ['Confidence', rel.confidence === null ? 'Set by you' : `${formatConfidence(rel.confidence)} · ${confidenceLabel(rel.confidence)}`],
            ['Extraction', rel.extraction_method === 'user' ? 'Added by you' : `Model, section-level · ${formatDate(rel.extracted_at).replace(' 2026', ' 2026')}`],
            ['Evidence', `${plural(rel.evidence_count, 'passage')} in ${plural(rel.source_count, 'source')}`],
          ]}
        />
        <h3 className="mt-6 text-sm font-medium text-fg-secondary">Evidence passages</h3>
        {rel.evidence.length === 0 ? (
          <p className="mt-2 text-sm text-fg-muted">No passages — this relationship was set by you.</p>
        ) : (
          <ul className="mt-3 flex flex-col gap-3">
            {rel.evidence.map((ev) => (
              <li key={ev.id} className="rounded-card border border-subtle bg-surface p-4">
                <p className="text-sm text-fg-secondary">
                  {ev.source_label} · p. {ev.page} · §{ev.section}
                </p>
                <EvidencePassage className="mt-2 text-base" passage={ev.passage} start={ev.char_start} end={ev.char_end} />
                <Link to={`/knowledge/sources/${ev.source_id}?page=${ev.page}`} className="mt-3 inline-block text-sm text-accent underline underline-offset-4 hover:text-fg">
                  Open in document
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
      {rel.status === 'candidate' ? (
        <div className="grid grid-cols-2 gap-3 border-t border-subtle px-6 py-4">
          <Button variant="primary" size="lg" onClick={() => decide('confirmed')} loading={review.isPending && review.variables?.status === 'confirmed'} loadingText="Confirming…" disabled={review.isPending}>
            <Check aria-hidden="true" />
            Confirm
          </Button>
          <Button variant="danger" size="lg" onClick={() => decide('rejected')} loading={review.isPending && review.variables?.status === 'rejected'} loadingText="Rejecting…" disabled={review.isPending}>
            <X aria-hidden="true" />
            Reject
          </Button>
        </div>
      ) : null}
    </div>
  );
}

export function InspectorHeader({ title, onClose }: { title: string; onClose: () => void }) {
  return (
    <div className="flex items-center justify-between border-b border-subtle px-6 py-4">
      <h2 className="text-lg font-semibold text-fg">{title}</h2>
      <button type="button" onClick={onClose} aria-label="Close inspector" className="flex size-9 items-center justify-center rounded-control text-fg-secondary hover:bg-elevated hover:text-fg">
        <X aria-hidden="true" className="size-5" />
      </button>
    </div>
  );
}
