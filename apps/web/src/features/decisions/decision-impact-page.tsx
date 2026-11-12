import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router';
import { FilePen, GitPullRequestArrow, ShieldCheck } from 'lucide-react';
import { formatDate } from '@/lib/format';
import { Button, ButtonLink } from '@/components/ui/button';
import { ReviewStateBadge } from '@/components/common/review-state-badge';
import { StatusBadge } from '@/components/common/status-badge';
import { ErrorState, InlineAlert, LoadingSkeleton } from '@/components/common/states';
import { useToast } from '@/components/common/toast';
import { DecisionImpactView } from './decision-impact-view';
import { KeepDecisionDialog, ReviseDecisionSheet } from './impact-actions';
import { useDecisionAlert, useProposeFromAlert } from './use-decisions';

const RESOLUTION: Record<string, string> = { kept: 'Kept after review', revised: 'Revised', action_proposed: 'Action proposed' };

/** Decision Impact review (UI.md §4.11): old vs new evidence and Keep / Revise / Propose action. */
export default function DecisionImpactPage() {
  const { alertId } = useParams();
  const { data: alert, isPending, error, refetch } = useDecisionAlert(alertId);
  const propose = useProposeFromAlert();
  const navigate = useNavigate();
  const toast = useToast();
  const [dialog, setDialog] = useState<'keep' | 'revise' | null>(null);

  if (isPending) return <LoadingSkeleton className="p-8" rows={8} label="Loading decision review…" />;
  if (error) return <ErrorState className="m-8" title="This review isn’t available" error={error} onRetry={() => refetch()} />;
  const open = alert.status === 'open';

  function proposeAction() {
    propose.mutate(
      { id: alert!.id },
      {
        onSuccess: ({ proposal_id }) => {
          toast.success('Proposal created · waiting for your approval');
          navigate(`/approvals/${proposal_id}`);
        },
        onError: (e) => toast.error(e.message),
      },
    );
  }

  return (
    <div className="mx-auto flex max-w-[1200px] flex-col gap-6 [&_a]:scroll-mb-28 [&_button]:scroll-mb-28">
      <nav aria-label="Breadcrumb" className="text-sm">
        <ol className="flex flex-wrap items-center gap-2 text-fg-secondary">
          <li><Link to="/knowledge/memory" className="underline underline-offset-4 hover:text-fg">Decisions</Link></li>
          <li aria-hidden="true">/</li>
          <li aria-current="page" className="text-fg">Decision Impact review</li>
        </ol>
      </nav>
      <header className="flex flex-col gap-3">
        <h1 className="text-2xl font-semibold text-fg">
          {alert.decision_code ? <span className="mr-2 font-mono text-xl text-fg-secondary">{alert.decision_code}</span> : null}
          {alert.decision_title}
        </h1>
        <div className="flex flex-wrap items-center gap-2 text-sm text-fg-secondary">
          {open ? <ReviewStateBadge state="needs_review" /> : <StatusBadge status={alert.status} />}
          <StatusBadge status={alert.severity} />
          <span>Detected {formatDate(alert.detected_at)} · {alert.project_name}</span>
        </div>
        <p className="text-base text-fg">A new paper contradicts a claim this decision depends on.</p>
      </header>
      {!open && alert.resolution ? (
        <InlineAlert tone="success" title={`${RESOLUTION[alert.resolution.kind]} on ${formatDate(alert.resolution.at)}`}>
          {alert.resolution.note ?? 'No note.'}{' '}
          {alert.resolution.replacement_memory_id ? (
            <Link to={`/knowledge/memory?decision=${alert.resolution.replacement_memory_id}`} className="text-accent underline underline-offset-4">
              Open the new decision
            </Link>
          ) : null}
          <span className="mt-1 block">This review is read-only now.</span>
        </InlineAlert>
      ) : null}
      {alert.trigger_source_deleted ? (
        <InlineAlert tone="warning" title="The contradicting source was deleted">
          {alert.trigger_source_label} is no longer in your collection, so its passage can’t be opened. You can still keep or revise the decision.
        </InlineAlert>
      ) : null}
      {alert.proposal_id ? (
        <InlineAlert tone="info" title="An action was proposed from this alert" icon={<ShieldCheck />}>
          It runs only after you approve it.{' '}
          <Link to={`/approvals/${alert.proposal_id}`} className="text-accent underline underline-offset-4">
            Open in Approvals
          </Link>
        </InlineAlert>
      ) : null}
      <DecisionImpactView alert={alert} />
      {open ? (
        <div role="group" aria-label="Decision actions" className="sticky bottom-20 z-30 -mx-4 border-t border-subtle bg-sidebar/95 px-4 py-3 backdrop-blur md:-mx-8 md:bottom-0 md:px-8 xl:-mx-12 xl:px-12">
          <div className="mx-auto flex max-w-[1200px] flex-wrap items-center justify-end gap-3">
            <p className="mr-auto hidden text-sm text-fg-secondary md:block">Choose what happens to this decision. Nothing is sent anywhere without your approval.</p>
            <Button onClick={() => setDialog('keep')}>Keep decision</Button>
            <Button onClick={() => setDialog('revise')}>
              <FilePen aria-hidden="true" />
              Revise decision
            </Button>
            {alert.proposal_id ? (
              <ButtonLink to={`/approvals/${alert.proposal_id}`} variant="primary">
                <GitPullRequestArrow aria-hidden="true" />
                Open proposal
              </ButtonLink>
            ) : (
              <Button variant="primary" onClick={proposeAction} loading={propose.isPending} loadingText="Creating proposal…">
                <GitPullRequestArrow aria-hidden="true" />
                Propose action
              </Button>
            )}
          </div>
        </div>
      ) : null}
      <KeepDecisionDialog alert={alert} open={dialog === 'keep'} onOpenChange={(o) => setDialog(o ? 'keep' : null)} />
      <ReviseDecisionSheet key={alert.updated_at} alert={alert} open={dialog === 'revise'} onOpenChange={(o) => setDialog(o ? 'revise' : null)} onDone={(id) => navigate(`/knowledge/memory?decision=${id}`)} />
    </div>
  );
}
