import { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router';
import { PanelLeftClose, Plus } from 'lucide-react';
import type { Conversation } from '@contracts/types';
import { cn } from '@/lib/cn';
import { dayKey, formatListDate } from '@/lib/format';
import { now } from '@/lib/clock';
import { useConversations } from '@/hooks/use-data';
import { Input } from '@/components/ui/field';
import { LoadingSkeleton, ErrorState } from '@/components/common/states';

function groupOf(c: Conversation): 'Today' | 'This week' | 'Earlier' {
  const days = Math.round((Date.parse(dayKey(now())) - Date.parse(dayKey(c.last_message_at))) / 86_400_000);
  if (days === 0) return 'Today';
  if (days < 7) return 'This week';
  return 'Earlier';
}

/** 280 px conversation list grouped by recency (design 2 · Assistant). */
export function ConversationList({ activeId, onCollapse, className }: { activeId?: string; onCollapse: () => void; className?: string }) {
  const navigate = useNavigate();
  const { data, isPending, error, refetch } = useConversations();
  const [filter, setFilter] = useState('');
  const groups = useMemo(() => {
    const q = filter.trim().toLowerCase();
    const list = (data ?? []).filter((c) => !q || c.title.toLowerCase().includes(q) || (c.project_name ?? '').toLowerCase().includes(q));
    const out = new Map<string, Conversation[]>();
    for (const c of list) out.set(groupOf(c), [...(out.get(groupOf(c)) ?? []), c]);
    return [...out.entries()];
  }, [data, filter]);

  return (
    <nav aria-label="Conversations" className={cn('min-h-0 flex-col border-r border-subtle bg-sidebar', className)}>
      <div className="flex items-center gap-1 px-4 pt-5">
        <h2 className="flex-1 text-base font-semibold text-fg">Conversations</h2>
        <button type="button" onClick={() => navigate('/assistant/new')} aria-label="New conversation" className="flex size-9 items-center justify-center rounded-control text-fg-secondary hover:bg-elevated hover:text-fg">
          <Plus aria-hidden="true" className="size-5" />
        </button>
        <button type="button" onClick={onCollapse} aria-label="Collapse conversation list" className="flex size-9 items-center justify-center rounded-control text-fg-secondary hover:bg-elevated hover:text-fg">
          <PanelLeftClose aria-hidden="true" className="size-5" />
        </button>
      </div>
      <div className="px-4 pt-3 pb-2">
        <label htmlFor="conv-filter" className="sr-only">
          Filter conversations
        </label>
        <Input id="conv-filter" type="search" name="conversation-filter" autoComplete="off" placeholder="Filter conversations…" value={filter} onChange={(e) => setFilter(e.target.value)} />
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto px-2 pb-4">
        {isPending ? (
          <LoadingSkeleton className="p-2" rows={4} label="Loading…" />
        ) : error ? (
          <ErrorState className="m-2" error={error} onRetry={() => refetch()} />
        ) : groups.length === 0 ? (
          <p className="px-3 py-4 text-sm text-fg-secondary">{filter ? 'No conversations match.' : 'No conversations yet.'}</p>
        ) : (
          groups.map(([label, items]) => (
            <section key={label} className="mt-3" aria-label={label}>
              <h3 className="px-3 pb-1 text-sm text-fg-muted">{label}</h3>
              <ul>
                {items.map((c) => (
                  <li key={c.id}>
                    <Link to={`/assistant/${c.id}`} aria-current={c.id === activeId ? 'page' : undefined} className={cn('block rounded-control px-3 py-2.5', c.id === activeId ? 'bg-elevated' : 'hover:bg-elevated/60')}>
                      <span className="block truncate text-base text-fg">{c.title}</span>
                      <span className="block truncate text-sm text-fg-secondary">
                        {c.project_name ?? 'Workspace'} · {formatListDate(c.last_message_at)}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          ))
        )}
      </div>
    </nav>
  );
}
