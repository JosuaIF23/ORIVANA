import { useProposals } from '@/hooks/use-data';
import { ButtonLink } from '@/components/ui/button';
import { StatusBadge } from '@/components/common/status-badge';
import { LoadingSkeleton, ErrorState } from '@/components/common/states';
import { HomeCard } from './home-card';

export function PendingApprovalsCard() {
  const { data, isPending, error, refetch } = useProposals('pending');
  const items = data?.items.filter((p) => p.status === 'awaiting_approval' || p.status === 'draft') ?? [];
  const [top, ...rest] = items;
  return (
    <HomeCard
      id="pending-approvals"
      title={
        <>
          Pending approvals <span className="font-normal text-fg-secondary">· {items.length}</span>
        </>
      }
      link={{ to: '/approvals', label: 'View all' }}
    >
      {isPending ? (
        <LoadingSkeleton rows={2} label="Loading approvals…" />
      ) : error ? (
        <ErrorState error={error} onRetry={() => refetch()} />
      ) : !top ? (
        <p className="text-base text-fg-secondary">Nothing waits for your decision. Proposed actions appear here before anything is sent.</p>
      ) : (
        <>
          <div className="flex items-center gap-4 rounded-card bg-elevated/60 p-4">
            <div className="min-w-0 flex-1">
              <p className="text-base font-medium text-fg">{top.title.replace('Create issue:', 'Create GitHub issue:')}</p>
              <p className="mt-2 flex flex-wrap items-center gap-3">
                <span className="font-mono text-xs text-fg-secondary">{top.target.repository}</span>
                <StatusBadge status={top.risk_level} />
              </p>
            </div>
            <ButtonLink to={`/approvals/${top.id}`} size="sm" aria-label={`Review ${top.title}`}>
              Review
            </ButtonLink>
          </div>
          {rest.length ? (
            <p className="mt-4 text-sm text-fg-secondary">
              +{rest.length} more: {rest.map((p) => p.title.replace('Create issue: ', '')).join(', ')}
            </p>
          ) : null}
        </>
      )}
    </HomeCard>
  );
}
