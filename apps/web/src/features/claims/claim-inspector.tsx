import { useState } from 'react';
import { Link } from 'react-router';
import { Check, Cpu, Merge, X } from 'lucide-react';
import { Button, ButtonLink } from '@/components/ui/button';
import { EvidenceCompare } from '@/components/common/evidence-compare';
import { ReviewStateBadge } from '@/components/common/review-state-badge';
import { StatusBadge } from '@/components/common/status-badge';
import { EmptyState, ErrorState, LoadingSkeleton } from '@/components/common/states';
import { useToast } from '@/components/common/toast';
import { InspectorHeader } from '@/features/graph/relationship-inspector';
import { MergeClaimDialog } from './merge-claim-dialog';
import { stanceItems, useClaim, useUpdateClaim } from './use-claims';

/** Evidence comparison for one claim: Supports | Contradicts, mentions, decisions, actions (UI.md §4.8). */
export function ClaimInspector({ id, onClose }: { id: string | null; onClose: () => void }) {
  const { data: claim, isPending, error, refetch } = useClaim(id);
  const update = useUpdateClaim();
  const toast = useToast();
  const [merging, setMerging] = useState(false);
  if (!id) return <EmptyState className="py-16" title="Select a claim" description="See the passages that support and contradict it side by side, and which decisions rely on it." />;
  if (isPending) return <LoadingSkeleton className="p-6" rows={6} label="Loading claim…" />;
  if (error) return <ErrorState className="m-6" error={error} onRetry={() => refetch()} />;

  const decide = (op: 'confirm' | 'reject') =>
    update.mutate({ id: claim.id, request: { op } }, { onSuccess: () => toast.success(op === 'confirm' ? 'Claim confirmed' : 'Claim rejected'), onError: (e) => toast.error(e.message) });
  const mentions = stanceItems(claim, 'mentions');
  const back = { href: `/knowledge/claims?claim=${claim.id}`, label: `claim “${claim.short_name}”` };

  return (
    <div className="flex h-full flex-col">
      <InspectorHeader title="Evidence comparison" onClose={onClose} />
      <div className="min-h-0 flex-1 overflow-y-auto px-6 py-5">
        <p className="text-lg font-semibold text-fg">{claim.statement}</p>
        <div className="mt-3 flex flex-wrap gap-2">
          <StatusBadge status={claim.status} size="md" />
        </div>
        {claim.used_by_decisions.length ? (
          <ul className="mt-4 flex flex-col gap-2">
            {claim.used_by_decisions.map((d) => (
              <li key={d.id} className="flex flex-wrap items-center gap-2 text-sm text-fg-secondary">
                Used by
                <Link to={`/knowledge/memory?decision=${d.id}`} className="text-accent underline underline-offset-4 hover:text-fg">
                  {d.code ? `${d.code} ` : ''}
                  {d.title}
                </Link>
                <ReviewStateBadge state={d.review_state} />
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-4 text-sm text-fg-muted">No decision depends on this claim yet.</p>
        )}
        <EvidenceCompare
          className="mt-6"
          back={back}
          left={{ title: 'Supports', icon: <Check />, tone: 'knowledge', items: stanceItems(claim, 'supports'), empty: 'No paper in your collection supports this claim.' }}
          right={{ title: 'Contradicts', icon: <X />, tone: 'danger', items: stanceItems(claim, 'contradicts'), empty: 'No paper in your collection contradicts this claim.' }}
        />
        {claim.context_note ? (
          <div className="mt-5 rounded-card border border-dashed border-control p-4">
            <p className="flex items-center gap-2 text-sm font-medium text-fg">
              <Cpu aria-hidden="true" className="size-4 text-fg-secondary" />
              ORIVANA note · model-generated
            </p>
            <p className="mt-1 text-sm text-fg-secondary">{claim.context_note.text}</p>
          </div>
        ) : null}
        {mentions.length ? (
          <details className="mt-5">
            <summary className="cursor-pointer text-sm font-medium text-fg-secondary hover:text-fg">Mentions · {mentions.length} papers</summary>
            <ul className="mt-3 flex flex-col gap-2 text-sm text-fg-secondary">
              {mentions.map((m) => (
                <li key={m.key}>
                  {m.source_label} · p. {m.page} — “{m.passage.slice(m.char_start, m.char_end)}”
                </li>
              ))}
            </ul>
          </details>
        ) : null}
      </div>
      <div className="flex flex-wrap gap-2 border-t border-subtle px-6 py-4">
        {claim.status === 'candidate' ? (
          <Button variant="primary" onClick={() => decide('confirm')} loading={update.isPending && update.variables?.request.op === 'confirm'} loadingText="Confirming…" disabled={update.isPending}>
            <Check aria-hidden="true" />
            Confirm claim
          </Button>
        ) : null}
        <Button onClick={() => setMerging(true)} disabled={update.isPending}>
          <Merge aria-hidden="true" />
          Merge with…
        </Button>
        {claim.status === 'candidate' ? (
          <Button variant="danger" onClick={() => decide('reject')} loading={update.isPending && update.variables?.request.op === 'reject'} loadingText="Rejecting…" disabled={update.isPending}>
            <X aria-hidden="true" />
            Reject
          </Button>
        ) : null}
        <ButtonLink variant="ghost" to={`/knowledge/map?focus=${claim.id}&sel=${claim.id}&depth=1&candidates=1`}>
          Open in Map
        </ButtonLink>
      </div>
      <MergeClaimDialog claim={claim} open={merging} onOpenChange={setMerging} />
    </div>
  );
}
