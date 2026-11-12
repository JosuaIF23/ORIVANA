import { Link, useNavigate } from 'react-router';
import { ArrowRightToLine, Link2, MoreHorizontal, Pencil, Trash2, X } from 'lucide-react';
import type { Memory } from '@contracts/types';
import { formatConfidence, formatListDate } from '@/lib/format';
import { Button } from '@/components/ui/button';
import { Menu } from '@/components/ui/menu';
import { OriginBadge, StatusBadge } from '@/components/common/status-badge';
import { useToast } from '@/components/common/toast';
import { useUpdateMemory } from './use-memory';

function evidenceHref(m: Memory): string | null {
  if (m.evidence.conversation_id) return `/assistant/${m.evidence.conversation_id}`;
  if (m.evidence.source_id) return `/knowledge/sources/${m.evidence.source_id}${m.evidence.page ? `?page=${m.evidence.page}` : ''}`;
  return null;
}

interface Props {
  memory: Memory;
  all: Memory[];
  onEdit: () => void;
  onSupersede: () => void;
  onDelete: () => void;
}

export function MemoryRow({ memory: m, all, onEdit, onSupersede, onDelete }: Props) {
  const navigate = useNavigate();
  const update = useUpdateMemory();
  const toast = useToast();
  const href = evidenceHref(m);
  const replacement = m.superseded_by_id ? all.find((x) => x.id === m.superseded_by_id) : null;
  const act = (op: 'confirm' | 'reject') =>
    update.mutate({ id: m.id, request: { op } }, { onSuccess: () => toast.success(op === 'confirm' ? 'Memory confirmed' : 'Memory rejected'), onError: (e) => toast.error(e.message) });

  return (
    <tr className="border-b border-subtle align-top last:border-b-0">
      <td className="px-3 py-4 text-sm text-fg-secondary capitalize">{m.memory_type}</td>
      <td className="min-w-52 px-3 py-4 text-base text-fg">
        <span className={m.status === 'superseded' ? 'text-fg-secondary line-through' : undefined}>{m.content}</span>
        {m.status === 'superseded' ? <p className="mt-1 text-sm text-fg-secondary">Superseded by: {replacement?.content ?? 'a newer memory'}</p> : null}
      </td>
      <td className="px-3 py-4 text-sm text-fg-secondary">{m.project_name ?? '—'}</td>
      <td className="px-3 py-4">
        <OriginBadge origin={m.origin} />
      </td>
      <td className="px-3 py-4 text-sm">
        {href ? (
          <Link to={href} className="text-accent underline underline-offset-4 hover:text-fg">
            {m.evidence.label}
          </Link>
        ) : (
          <span className="text-accent">{m.evidence.label}</span>
        )}
      </td>
      <td className="px-3 py-4 text-sm whitespace-nowrap text-fg-secondary">{formatListDate(m.updated_at)}</td>
      <td className="px-3 py-4">
        <StatusBadge status={m.status} />
      </td>
      <td className="px-3 py-4 text-right text-sm text-fg-secondary tabular">{formatConfidence(m.confidence)}</td>
      <td className="px-3 py-3">
        <div className="flex items-center justify-end gap-1">
          {m.status === 'candidate' ? (
            <Button size="sm" onClick={() => act('confirm')} loading={update.isPending && update.variables?.request.op === 'confirm'} loadingText="Confirming…" disabled={update.isPending}>
              Confirm
            </Button>
          ) : null}
          {m.status === 'candidate' || m.status === 'confirmed' ? (
            <Button variant="ghost" size="icon-sm" aria-label={`Edit memory: ${m.content}`} onClick={onEdit}>
              <Pencil aria-hidden="true" />
            </Button>
          ) : null}
          {m.status === 'candidate' ? (
            <Button variant="ghost" size="icon-sm" aria-label={`Reject memory: ${m.content}`} onClick={() => act('reject')} disabled={update.isPending}>
              <X aria-hidden="true" />
            </Button>
          ) : null}
          <Menu
            trigger={
              <button type="button" aria-label={`More actions for: ${m.content}`} className="flex size-8 items-center justify-center rounded-control text-fg-secondary hover:bg-elevated hover:text-fg">
                <MoreHorizontal aria-hidden="true" className="size-4" />
              </button>
            }
            items={[
              { label: 'Edit', icon: <Pencil />, onSelect: onEdit, disabled: m.status === 'superseded' || m.status === 'rejected' },
              { label: 'Mark superseded by…', icon: <ArrowRightToLine />, onSelect: onSupersede, disabled: m.status !== 'confirmed' },
              { label: 'View related memories', icon: <Link2 />, onSelect: () => navigate(`/knowledge/memory?status=all&type=${m.memory_type}${m.project_id ? `&project=${m.project_id}` : ''}`) },
              { label: 'Delete…', icon: <Trash2 />, onSelect: onDelete, tone: 'danger', separatorBefore: true },
            ]}
          />
        </div>
      </td>
    </tr>
  );
}
