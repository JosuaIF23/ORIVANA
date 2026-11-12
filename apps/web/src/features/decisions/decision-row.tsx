import { useNavigate } from 'react-router';
import { ArrowRightToLine, Check, GitBranch, MoreHorizontal, Pencil, Trash2, X } from 'lucide-react';
import type { Memory } from '@contracts/types';
import { cn } from '@/lib/cn';
import { formatListDate } from '@/lib/format';
import { Button, ButtonLink } from '@/components/ui/button';
import { Menu } from '@/components/ui/menu';
import { ReviewStateBadge } from '@/components/common/review-state-badge';
import { OriginBadge, StatusBadge } from '@/components/common/status-badge';
import { useToast } from '@/components/common/toast';
import { useUpdateMemory } from '@/features/memory/use-memory';

interface Props {
  decision: Memory;
  replacement: Memory | undefined;
  onOpen: () => void;
  onEdit: () => void;
  onSupersede: () => void;
  onDelete: () => void;
}

/** One decision: title, statement, status, review state, dependencies, evidence, date, origin (UI.md §4.10). */
export function DecisionRow({ decision: d, replacement, onOpen, onEdit, onSupersede, onDelete }: Props) {
  const navigate = useNavigate();
  const update = useUpdateMemory();
  const toast = useToast();
  const superseded = d.status === 'superseded';
  const reviewable = d.status === 'proposed' || d.status === 'candidate';
  const act = (op: 'confirm' | 'reject') =>
    update.mutate({ id: d.id, request: { op } }, { onSuccess: () => toast.success(op === 'confirm' ? 'Decision confirmed' : 'Decision rejected'), onError: (e) => toast.error(e.message) });
  const deps = d.dependencies?.length ?? 0;
  const evidence = d.decision?.evidence.length ?? 0;

  return (
    <li className={cn('relative rounded-card border bg-surface p-4 md:p-5', d.review_state === 'needs_review' ? 'border-warning/60' : 'border-subtle', reviewable && 'border-dashed')}>
      <div className="flex flex-wrap items-start gap-x-4 gap-y-2">
        <div className="min-w-0 flex-1">
          <h3 className="text-base font-semibold text-fg">
            <button type="button" onClick={onOpen} className={cn('text-left hover:underline hover:underline-offset-4', superseded && 'text-fg-secondary line-through')}>
              {d.decision?.code ? <span className="mr-2 font-mono text-sm text-fg-secondary">{d.decision.code}</span> : null}
              {d.title ?? d.content}
            </button>
          </h3>
          {d.content !== d.title ? <p className="mt-1 text-sm text-fg-secondary">{d.content}</p> : null}
          {superseded ? <p className="mt-1 text-sm text-fg-secondary">Superseded by {replacement ? `${replacement.decision?.code ?? ''} ${replacement.title ?? replacement.content}` : 'a newer decision'}</p> : null}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <ReviewStateBadge state={d.review_state} />
          <StatusBadge status={d.status} />
        </div>
      </div>
      <p className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-fg-secondary">
        <span>{d.project_name ?? 'No project'}</span>
        <span>
          {deps} claim{deps === 1 ? '' : 's'} · {evidence} evidence link{evidence === 1 ? '' : 's'}
        </span>
        <span>{d.decided_at ? `Decided ${formatListDate(d.decided_at)}` : `Proposed ${formatListDate(d.created_at)}`}</span>
        <OriginBadge origin={d.origin} />
      </p>
      <div className="mt-4 flex flex-wrap items-center gap-2">
        {d.open_alert_id ? (
          <ButtonLink to={`/decision-alerts/${d.open_alert_id}`} variant="primary" size="sm">
            Review
          </ButtonLink>
        ) : null}
        {reviewable ? (
          <>
            <Button size="sm" onClick={() => act('confirm')} loading={update.isPending && update.variables?.request.op === 'confirm'} loadingText="Confirming…" disabled={update.isPending}>
              <Check aria-hidden="true" />
              Confirm
            </Button>
            <Button variant="ghost" size="sm" onClick={() => act('reject')} disabled={update.isPending}>
              <X aria-hidden="true" />
              Reject
            </Button>
          </>
        ) : null}
        <Button variant="ghost" size="sm" onClick={onOpen}>
          <GitBranch aria-hidden="true" />
          View dependencies
        </Button>
        <Menu
          trigger={
            <button type="button" aria-label={`More actions for ${d.title ?? d.content}`} className="flex size-8 items-center justify-center rounded-control text-fg-secondary hover:bg-elevated hover:text-fg">
              <MoreHorizontal aria-hidden="true" className="size-4" />
            </button>
          }
          items={[
            { label: 'Edit', icon: <Pencil />, onSelect: onEdit, disabled: superseded || d.status === 'rejected' },
            { label: 'Supersede (choose replacement)…', icon: <ArrowRightToLine />, onSelect: onSupersede, disabled: d.status !== 'confirmed' },
            { label: 'Open in project', icon: <GitBranch />, onSelect: () => navigate(`/projects/${d.project_id ?? ''}/decisions#${d.id}`), disabled: !d.project_id },
            { label: 'Delete…', icon: <Trash2 />, onSelect: onDelete, tone: 'danger', separatorBefore: true },
          ]}
        />
      </div>
    </li>
  );
}
