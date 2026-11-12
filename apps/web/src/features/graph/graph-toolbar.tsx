import { useEffect, useState } from 'react';
import { Crosshair, Search, X } from 'lucide-react';
import { cn } from '@/lib/cn';
import { Input } from '@/components/ui/field';
import type { GraphState } from './graph-state';

interface Props {
  state: GraphState;
  set: (patch: Record<string, string | null>) => void;
  focusName: string | null;
  projectName: string | null;
  nodeCount: number;
  edgeCount: number;
}

/** Find, Focus on, depth (1/2 hops), counts, Map/List toggle. */
export function GraphToolbar({ state, set, focusName, projectName, nodeCount, edgeCount }: Props) {
  const [find, setFind] = useState(state.find);
  useEffect(() => {
    const id = window.setTimeout(() => set({ q: find || null }), 200);
    return () => window.clearTimeout(id);
  }, [find, set]);

  const seg = (active: boolean) => cn('h-full rounded-badge px-4 text-sm', active ? 'bg-elevated font-medium text-fg' : 'text-fg-secondary hover:text-fg');

  return (
    <div className="flex flex-wrap items-center gap-3 border-b border-subtle px-4 py-3">
      {state.view === 'graph' ? (
        <>
          <div className="relative w-52">
            <Search aria-hidden="true" className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-fg-secondary" />
            <label htmlFor="graph-find" className="sr-only">
              Find in graph
            </label>
            <Input id="graph-find" type="search" name="graph-find" autoComplete="off" placeholder="Find in graph…" className="pl-9" value={find} onChange={(e) => setFind(e.target.value)} />
          </div>
          <button
            type="button"
            onClick={() => set({ focus: null, depth: null })}
            disabled={!focusName}
            className="inline-flex h-10 items-center gap-2 rounded-control border border-control bg-elevated px-3 text-sm text-fg hover:border-fg-muted disabled:cursor-default"
            aria-label={focusName ? `Focus on: ${focusName}. Clear focus` : `Focus on: ${projectName ?? 'project'}`}
          >
            <Crosshair aria-hidden="true" className="size-4" />
            Focus on: {focusName ?? projectName ?? 'Project'}
            {focusName ? <X aria-hidden="true" className="size-4 text-fg-secondary" /> : null}
          </button>
          <div role="group" aria-label="Map depth" className="flex h-10 rounded-control border border-control p-0.5">
            <button type="button" aria-pressed={state.depth === 1} onClick={() => set({ depth: '1' })} className={seg(state.depth === 1)}>
              1 hop
            </button>
            <button type="button" aria-pressed={state.depth === 2} onClick={() => set({ depth: null })} className={seg(state.depth === 2)}>
              2 hops
            </button>
          </div>
          <p aria-live="polite" className="text-sm text-fg-secondary tabular">
            {nodeCount} nodes · {edgeCount} edges
          </p>
        </>
      ) : (
        <h2 className="text-lg font-semibold text-fg">
          Relationships <span className="ml-2 text-sm font-normal text-fg-secondary">Candidates first · {edgeCount} total</span>
        </h2>
      )}
      <div role="group" aria-label="View" className="ml-auto flex h-10 rounded-control border border-control p-0.5">
        <button type="button" aria-pressed={state.view === 'graph'} onClick={() => set({ view: null, page: null })} className={seg(state.view === 'graph')}>
          Map
        </button>
        <button type="button" aria-pressed={state.view === 'list'} onClick={() => set({ view: 'list' })} className={seg(state.view === 'list')}>
          List view
        </button>
      </div>
    </div>
  );
}
