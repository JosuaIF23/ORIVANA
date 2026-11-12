import { Link } from 'react-router';
import type { ActionProposal } from '@contracts/types';
import { cn } from '@/lib/cn';
import { formatAge, formatDayMonth } from '@/lib/format';
import { StatusBadge } from '@/components/common/status-badge';
import { ProposalOrigin } from './proposal-origin';

export function ProposalList({ items, activeId, tab }: { items: ActionProposal[]; activeId?: string; tab: 'pending' | 'decided' }) {
  return (
    <div className="p-4">
      <ul className="flex flex-col gap-2">
        {items.map((p) => (
          <li key={p.id}>
            <Link
              to={`/approvals/${p.id}${tab === 'decided' ? '?tab=decided' : ''}`}
              aria-current={p.id === activeId ? 'page' : undefined}
              className={cn('block rounded-card border p-4', p.id === activeId ? 'border-accent/70 bg-elevated' : 'border-transparent hover:bg-surface')}
            >
              <span className="flex items-start gap-3">
                <span className="min-w-0 flex-1 text-base font-semibold text-fg">{p.title}</span>
                <span className="shrink-0 text-sm text-fg-secondary">{tab === 'pending' ? formatAge(p.created_at) : formatDayMonth(p.decided_at ?? p.created_at)}</span>
              </span>
              <span className="mt-2 block text-sm text-fg-secondary">
                <span className="font-mono text-xs">{p.target.repository}</span> · GitHub · {p.project_name}
              </span>
              <span className="mt-1 block">
                <ProposalOrigin proposal={p} compact />
              </span>
              <span className="mt-3 flex flex-wrap gap-2">
                <StatusBadge status={p.risk_level} />
                {tab === 'decided' || p.status !== 'awaiting_approval' ? <StatusBadge status={p.status} /> : null}
              </span>
            </Link>
          </li>
        ))}
      </ul>
      {tab === 'pending' ? <p className="mt-6 px-1 text-sm text-fg-secondary">Proposals expire after 7 days if undecided. Decided proposals keep their full audit trail.</p> : null}
    </div>
  );
}
