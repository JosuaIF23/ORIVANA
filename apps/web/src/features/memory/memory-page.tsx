import { useCallback, useState } from 'react';
import { useSearchParams } from 'react-router';
import { CircleCheck, Plus } from 'lucide-react';
import type { MemoryStatus, MemoryType } from '@contracts/types';
import { useProjectsList } from '@/hooks/use-data';
import { Button } from '@/components/ui/button';
import { EmptyState, ErrorState, LoadingSkeleton } from '@/components/common/states';
import { KnowledgeHeader } from '@/features/sources/knowledge-header';
import { MemoryToolbar } from './memory-toolbar';
import { MemoryTable } from './memory-table';
import { MemoryFormDialog } from './memory-dialogs';
import { useMemories } from './use-memory';

export type MemoryTab = 'needs_review' | MemoryStatus | 'all';

/** Knowledge → Memory (UI.md §4.8). Default view: candidates first, then confirmed. */
export default function MemoryPage() {
  const [params, setParams] = useSearchParams();
  const { data: projects = [] } = useProjectsList();
  const [adding, setAdding] = useState(false);
  const tab = (params.get('status') as MemoryTab) ?? 'needs_review';
  const query = {
    status: tab === 'all' ? undefined : tab,
    memory_type: (params.get('type') as MemoryType) || undefined,
    project_id: params.get('project') || undefined,
    q: params.get('q') || undefined,
  };
  const { data, isPending, error, refetch } = useMemories(query);
  const set = useCallback(
    (key: string, value: string | null) =>
      setParams((p) => {
        if (value) p.set(key, value);
        else p.delete(key);
        return p;
      }, { replace: true }),
    [setParams],
  );

  const nothingToReview = tab === 'needs_review' && data && data.counts.candidate === 0;

  return (
    <div>
      <KnowledgeHeader />
      <div className="flex flex-col gap-6 px-4 py-8 md:px-8">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h2 className="text-xl font-semibold text-fg">Memory</h2>
            <p className="mt-1 text-base text-fg-secondary">What ORIVANA remembers about your work. Model-proposed items stay candidates until you confirm them.</p>
          </div>
          <Button variant="primary" size="lg" onClick={() => setAdding(true)}>
            <Plus aria-hidden="true" />
            Add memory
          </Button>
        </div>
        <MemoryToolbar tab={tab} counts={data?.counts} params={params} projects={projects} onChange={set} />
        {isPending ? (
          <LoadingSkeleton rows={6} label="Loading memories…" />
        ) : error ? (
          <ErrorState error={error} onRetry={() => refetch()} />
        ) : (
          <>
            {nothingToReview ? (
              <EmptyState
                className="rounded-card border border-subtle bg-surface"
                icon={<CircleCheck />}
                title="You’re all caught up"
                description="No candidate memories to review. New ones appear after conversations and uploads."
                action={<Button variant="ghost" onClick={() => set('status', 'confirmed')}>Show confirmed memories</Button>}
              />
            ) : null}
            {data.items.length ? (
              <MemoryTable items={data.items} grouped={tab === 'needs_review' || tab === 'all'} />
            ) : nothingToReview ? null : (
              <EmptyState title="No memories match" description="Change the filters, or add a memory yourself." />
            )}
          </>
        )}
        <p className="text-sm text-fg-secondary">Superseded memories stay in history and are never used as current facts in answers.</p>
      </div>
      <MemoryFormDialog open={adding} onOpenChange={setAdding} />
    </div>
  );
}
