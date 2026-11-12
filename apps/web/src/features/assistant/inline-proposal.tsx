import { useState } from 'react';
import { Link, useNavigate } from 'react-router';
import { Check, ExternalLink, Pencil, X } from 'lucide-react';
import { useProposal } from '@/hooks/use-data';
import { Button } from '@/components/ui/button';
import { StatusBadge } from '@/components/common/status-badge';
import { LoadingSkeleton } from '@/components/common/states';
import { RejectDialog } from '@/features/approvals/reject-dialog';
import { useApprove } from '@/features/approvals/use-approvals';

/**
 * Action proposal shown inline in the conversation with the same controls as
 * Approvals (UI.md §4.10). Success is shown only after verification.
 */
export function InlineProposal({ proposalId }: { proposalId: string }) {
  const navigate = useNavigate();
  const { data: p, isPending } = useProposal(proposalId);
  const approve = useApprove();
  const [rejecting, setRejecting] = useState(false);
  if (isPending) return <LoadingSkeleton rows={2} label="Loading proposal…" />;
  if (!p) return null;
  const run = p.latest_run;
  const open = p.status === 'awaiting_approval' || p.status === 'draft';

  return (
    <section aria-label="Proposed action" className="rounded-card border border-warning/40 bg-surface p-5">
      <div className="flex flex-wrap items-center gap-3">
        <h3 className="min-w-0 flex-1 text-base font-semibold text-fg">
          {p.action_label.replace('Create 1 issue', 'Create issue')} in <span className="font-mono text-sm">{p.target.repository}</span>
        </h3>
        <StatusBadge status={p.risk_level} />
        <StatusBadge status={p.status} />
        {p.status === 'succeeded' && run?.verified_at ? <StatusBadge status="verified" /> : null}
      </div>
      <p className="mt-2 text-base text-fg">“{p.arguments.title}”</p>
      <p className="mt-1 text-sm text-fg-secondary">
        GitHub · {p.target.account} · labels: {p.arguments.labels.join(', ') || 'none'} · nothing is sent until you approve.
      </p>
      {p.validation.status === 'failed' ? <p className="mt-2 text-sm text-warning">{p.validation.issues[0]?.message}</p> : null}
      {approve.error ? <p role="alert" className="mt-2 text-sm text-danger">{approve.error.message}</p> : null}
      <div className="mt-4 flex flex-wrap items-center gap-3">
        {open ? (
          <>
            <Button variant="primary" size="sm" onClick={() => approve.mutate(p.id)} loading={approve.isPending} loadingText="Approving…" disabled={p.status !== 'awaiting_approval'}>
              <Check aria-hidden="true" />
              Approve
            </Button>
            <Button size="sm" onClick={() => navigate(`/approvals/${p.id}/edit`)}>
              <Pencil aria-hidden="true" />
              Edit
            </Button>
            <Button variant="danger" size="sm" onClick={() => setRejecting(true)}>
              <X aria-hidden="true" />
              Reject
            </Button>
          </>
        ) : p.status === 'succeeded' && run?.external_url ? (
          <a href={run.external_url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 text-sm text-accent underline underline-offset-4">
            Open {run.external_ref} on GitHub
            <ExternalLink aria-hidden="true" className="size-3.5" />
          </a>
        ) : null}
        <Link to={`/approvals/${p.id}`} className="ml-auto rounded-control text-sm text-accent underline underline-offset-4 hover:text-fg">
          Review in Approvals
        </Link>
      </div>
      <RejectDialog proposal={p} open={rejecting} onOpenChange={setRejecting} />
    </section>
  );
}
