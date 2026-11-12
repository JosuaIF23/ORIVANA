import { useCallback, useState } from 'react';
import { useSearchParams } from 'react-router';
import { CircleCheck, Plus } from 'lucide-react';
import type { MemoryStatus, MemoryType } from '@contracts/types';
import { cn } from '@/lib/cn';
import { useProjectsList } from '@/hooks/use-data';
import { Button } from '@/components/ui/button';
import { EmptyState, ErrorState, LoadingSkeleton } from '@/components/common/states';
import { KnowledgeHeader } from '@/features/sources/knowledge-header';
import { DecisionsView, type DecisionFilter } from '@/features/decisions/decisions-view';
import { DecisionSheet } from '@/features/decisions/decision-sheet';
import { MemoryToolbar } from './memory-toolbar';
import { MemoryTable } from './memory-table';
import { MemoryFormDialog } from './memory-dialogs';
import { useMemories } from './use-memory';

export type MemoryTab = 'needs_review' | MemoryStatus | 'all';

/**
 * Knowledge → Memory (UI.md v2 §4.10). Primary view: Decisions, ordered
 * Needs review → Proposed → Confirmed. Other memory types are a secondary view.
 */
export default function MemoryPage() {
  const [params, setParams] = useSearchParams();
  const { data: projects = [] } = useProjectsList();
  const [adding, setAdding] = useState(false);
  const view = params.get('view') === 'memories' || params.has('status') ? 'memories' : 'decisions';
  const set = useCallback(
    (key: string, value: string | null) =>
      setParams((p) => {
        if (value) p.set(key, value);
        else p.delete(key);
        return p;
      }, { replace: true }),
    [setParams],
  );
  const switchView = (next: 'decisions' | 'memories') =>
    setParams((p) => {
      const out = new URLSearchParams();
      if (next === 'memories') out.set('view', 'memories');
      if (p.get('project')) out.set('project', p.get('project')!);
      return out;
    }, { replace: true });

  return (
    <div>
      <KnowledgeHeader />
      <div className="flex flex-col gap-6 px-4 py-8 md:px-8">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h2 className="text-xl font-semibold text-fg">Memory</h2>
            <p className="mt-1 text-base text-fg-secondary">Your decisions and what ORIVANA remembers about your work. Model-proposed items wait for your review.</p>
          </div>
          {view === 'memories' ? (
            <Button variant="primary" size="lg" onClick={() => setAdding(true)}>
              <Plus aria-hidden="true" />
              Add memory
            </Button>
          ) : null}
        </div>
        <nav aria-label="Memory views" className="flex gap-6 border-b border-subtle">
          {(['decisions', 'memories'] as const).map((v) => (
            <button key={v} type="button" aria-pressed={view === v} onClick={() => switchView(v)} className={cn('-mb-px border-b-2 pb-2 text-base', view === v ? 'border-accent font-medium text-fg' : 'border-transparent text-fg-secondary hover:text-fg')}>
              {v === 'decisions' ? 'Decisions' : 'Other memories'}
            </button>
          ))}
        </nav>
        {view === 'decisions' ? (
          <DecisionsView
            filter={(params.get('dstatus') as DecisionFilter) || 'review'}
            projectId={params.get('project') || undefined}
            q={params.get('q') ?? ''}
            projects={projects}
            onChange={set}
            onOpen={(id) => set('decision', id)}
          />
        ) : (
          <OtherMemories params={params} set={set} projects={projects} />
        )}
        <p className="text-sm text-fg-secondary">Superseded decisions and memories stay in history and are never used as current facts in answers.</p>
      </div>
      <DecisionSheet id={params.get('decision')} onClose={() => set('decision', null)} />
      <MemoryFormDialog open={adding} onOpenChange={setAdding} />
    </div>
  );
}

/** Episodic, semantic, procedural, and project memories (v1 view). */
function OtherMemories({ params, set, projects }: { params: URLSearchParams; set: (key: string, value: string | null) => void; projects: Parameters<typeof MemoryToolbar>[0]['projects'] }) {
  const tab = (params.get('status') as MemoryTab) ?? 'needs_review';
  const { data, isPending, error, refetch } = useMemories({
    status: tab === 'all' ? undefined : tab,
    memory_type: (params.get('type') as MemoryType) || undefined,
    project_id: params.get('project') || undefined,
    q: params.get('q') || undefined,
  });
  const nothingToReview = tab === 'needs_review' && data && data.counts.candidate === 0;
  return (
    <>
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
          {data.items.length ? <MemoryTable items={data.items} grouped={tab === 'needs_review' || tab === 'all'} /> : nothingToReview ? null : <EmptyState title="No memories match" description="Change the filters, or add a memory yourself." />}
        </>
      )}
    </>
  );
}
