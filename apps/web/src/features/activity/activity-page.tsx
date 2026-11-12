import { useCallback, useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router';
import { Download } from 'lucide-react';
import type { ActorType, AuditCategory, AuditEvent } from '@contracts/types';
import { exportAuditCsv } from '@/services/audit';
import { formatDayGroup, dayKey } from '@/lib/format';
import { useAuditEvents } from '@/hooks/use-data';
import { Button } from '@/components/ui/button';
import { Input, Select } from '@/components/ui/field';
import { PageHeader } from '@/components/common/page-header';
import { EmptyState, ErrorState, LoadingSkeleton } from '@/components/common/states';
import { useToast } from '@/components/common/toast';
import { CategoryChips } from './category-chips';
import { ActivityRow } from './activity-row';

/** Activity and audit (UI.md §4.12). Filters live in the URL. */
export default function ActivityPage() {
  const [params, setParams] = useSearchParams();
  const toast = useToast();
  const categories = (params.get('cat')?.split(',').filter(Boolean) ?? []) as AuditCategory[];
  const actor = (params.get('actor') as ActorType) || undefined;
  const since = Number(params.get('since') ?? 7) as 1 | 7 | 30;
  const [limit, setLimit] = useState(10);
  const [q, setQ] = useState(params.get('q') ?? '');
  const query = { categories, actor_type: actor, since_days: since, q: params.get('q') ?? undefined, limit };
  const { data, isPending, error, refetch, isFetching } = useAuditEvents(query);

  const set = useCallback((key: string, value: string | null) => setParams((p) => { if (value) p.set(key, value); else p.delete(key); return p; }, { replace: true }), [setParams]);
  useEffect(() => {
    const id = window.setTimeout(() => { if ((params.get('q') ?? '') !== q) set('q', q || null); }, 250);
    return () => window.clearTimeout(id);
  }, [q, params, set]);

  const groups = useMemo(() => {
    const out = new Map<string, AuditEvent[]>();
    for (const e of data?.items ?? []) out.set(dayKey(e.created_at), [...(out.get(dayKey(e.created_at)) ?? []), e]);
    return [...out.values()];
  }, [data]);

  async function exportCsv() {
    try {
      const csv = await exportAuditCsv({ categories, actor_type: actor, since_days: since });
      const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }));
      const a = Object.assign(document.createElement('a'), { href: url, download: 'orivana-activity.csv' });
      a.click();
      URL.revokeObjectURL(url);
      toast.success('Activity log exported');
    } catch (e) {
      toast.error((e as Error).message);
    }
  }

  return (
    <div className="mx-auto flex max-w-[1240px] flex-col gap-6">
      <PageHeader title="Activity" description="Audit timeline of everything you, the agent, and the system did in Personal workspace." actions={<Button size="lg" onClick={exportCsv}><Download aria-hidden="true" />Export log (CSV)</Button>} />
      <CategoryChips selected={categories} counts={data?.counts} onChange={(next) => set('cat', next.join(',') || null)} />
      <div className="flex flex-wrap items-center gap-4">
        <label className="flex items-center gap-2 text-sm text-fg-secondary">
          Actor
          <Select className="w-40" value={actor ?? ''} onChange={(e) => set('actor', e.target.value || null)}>
            <option value="">All actors</option>
            <option value="user">You</option>
            <option value="agent">Agent</option>
            <option value="system">System</option>
          </Select>
        </label>
        <label className="flex items-center gap-2 text-sm text-fg-secondary">
          When
          <Select className="w-40" value={String(since)} onChange={(e) => set('since', e.target.value === '7' ? null : e.target.value)}>
            <option value="1">Last 24 hours</option>
            <option value="7">Last 7 days</option>
            <option value="30">Last 30 days</option>
          </Select>
        </label>
        <label htmlFor="activity-search" className="sr-only">Search activity</label>
        <Input id="activity-search" type="search" name="activity-search" autoComplete="off" className="min-w-60 flex-1" placeholder="Search by target, ID, or text…" value={q} onChange={(e) => setQ(e.target.value)} />
        <p aria-live="polite" className="text-sm text-fg-secondary tabular">{data ? `Showing ${data.items.length} of ${data.total} events` : ''}</p>
      </div>
      {isPending ? (
        <LoadingSkeleton rows={8} label="Loading activity…" />
      ) : error ? (
        <ErrorState error={error} onRetry={() => refetch()} />
      ) : data.items.length === 0 ? (
        <EmptyState title="No events match" description="Change the filters or the time range." />
      ) : (
        <>
          {groups.map((events) => (
            <section key={events[0].id} aria-label={formatDayGroup(events[0].created_at)}>
              <h2 className="border-b border-subtle pb-3 text-sm font-medium text-fg-secondary">{formatDayGroup(events[0].created_at)}</h2>
              <ol>
                {events.map((e) => (
                  <ActivityRow key={e.id} event={e} defaultOpen={e.category === 'errors' && e.id === data.items.find((x) => x.category === 'errors')?.id} />
                ))}
              </ol>
            </section>
          ))}
          {data.next_cursor ? (
            <Button variant="ghost" size="lg" className="self-center" onClick={() => setLimit((l) => l + 10)} loading={isFetching} loadingText="Loading…">
              Load older events
            </Button>
          ) : null}
        </>
      )}
    </div>
  );
}
