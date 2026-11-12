import { Navigate, useLocation, useParams, useSearchParams } from 'react-router';
import { ShieldCheck } from 'lucide-react';
import { useProposals } from '@/hooks/use-data';
import { EmptyState, ErrorState, LoadingSkeleton } from '@/components/common/states';
import { ProposalList } from './proposal-list';
import { ProposalDetail } from './proposal-detail';

/** Approvals (UI.md §4.10): Pending · Decided list + review panel. */
export default function ApprovalsPage() {
  const { proposalId } = useParams();
  const { pathname } = useLocation();
  const [params, setParams] = useSearchParams();
  const tab = params.get('tab') === 'decided' ? 'decided' : 'pending';
  const list = useProposals(tab);
  const editing = pathname.endsWith('/edit');

  if (!proposalId && list.data?.items[0] && window.matchMedia('(min-width: 1024px)').matches) {
    return <Navigate to={`/approvals/${list.data.items[0].id}${tab === 'decided' ? '?tab=decided' : ''}`} replace />;
  }

  return (
    <div className="flex min-h-[calc(100dvh-var(--topbar-height))] flex-col">
      <header className="border-b border-subtle px-4 pt-6 md:px-8">
        <div className="flex flex-wrap items-baseline gap-x-4 gap-y-1">
          <h1 className="text-xl font-semibold text-fg">Approvals</h1>
          <p className="text-sm text-fg-secondary">Every write to an external app waits here for your decision.</p>
        </div>
        <nav aria-label="Approval lists" className="mt-4">
          <ul className="flex gap-8">
            {(['pending', 'decided'] as const).map((t) => (
              <li key={t}>
                <button
                  type="button"
                  aria-pressed={tab === t}
                  onClick={() => setParams(t === 'decided' ? { tab: 'decided' } : {}, { replace: true })}
                  className={`-mb-px inline-flex items-center gap-2 border-b-2 pb-3 text-base ${tab === t ? 'border-accent font-medium text-fg' : 'border-transparent text-fg-secondary hover:text-fg'}`}
                >
                  {t === 'pending' ? 'Pending' : 'Decided'}
                  {list.data ? <span className="rounded-full bg-elevated px-2 text-xs text-fg-secondary tabular">{t === 'pending' ? list.data.counts.pending : list.data.counts.decided}</span> : null}
                </button>
              </li>
            ))}
          </ul>
        </nav>
      </header>
      <div className="grid flex-1 lg:grid-cols-[420px_minmax(0,1fr)]">
        <div className="border-r border-subtle">
          {list.isPending ? (
            <LoadingSkeleton className="p-4" rows={4} label="Loading proposals…" />
          ) : list.error ? (
            <ErrorState className="m-4" error={list.error} onRetry={() => list.refetch()} />
          ) : list.data.items.length === 0 ? (
            <EmptyState icon={<ShieldCheck />} title={tab === 'pending' ? 'Nothing waits for approval' : 'No decisions yet'} description="When ORIVANA prepares an action, it appears here before anything is sent." />
          ) : (
            <ProposalList items={list.data.items} activeId={proposalId} tab={tab} />
          )}
        </div>
        <div className="min-w-0">
          {proposalId ? <ProposalDetail id={proposalId} editing={editing} /> : <EmptyState className="hidden lg:flex" title="Select a proposal" description="Review the exact content, target, and side effects before approving." />}
        </div>
      </div>
    </div>
  );
}
