import { useProposal } from '@/hooks/use-data';
import { ErrorState, LoadingSkeleton } from '@/components/common/states';
import { ProposalReview } from './proposal-review';
import { ProposalEditor } from './proposal-editor';
import { ExecutingView, FailedView, RejectedView, SucceededView } from './run-views';

/** Picks the view for the proposal's lifecycle state (PRD §12). */
export function ProposalDetail({ id, editing }: { id: string; editing: boolean }) {
  const { data: p, isPending, error, refetch } = useProposal(id);
  if (isPending) return <LoadingSkeleton className="p-8" rows={6} label="Loading proposal…" />;
  if (error) return <ErrorState className="m-8" error={error} onRetry={() => refetch()} />;
  if (editing && (p.status === 'awaiting_approval' || p.status === 'draft')) return <ProposalEditor key={`${p.id}-${p.revision}`} proposal={p} />;
  switch (p.status) {
    case 'approved':
    case 'executing':
    case 'verifying':
      return <ExecutingView proposal={p} />;
    case 'succeeded':
      return <SucceededView proposal={p} />;
    case 'failed':
      return <FailedView proposal={p} />;
    case 'rejected':
    case 'expired':
      return <RejectedView proposal={p} />;
    default:
      return <ProposalReview proposal={p} />;
  }
}
