import { useMemo } from 'react';
import { Waypoints } from 'lucide-react';
import { now } from '@/lib/clock';
import { useProjectsList } from '@/hooks/use-data';
import { ButtonLink } from '@/components/ui/button';
import { Dialog } from '@/components/ui/dialog';
import { EmptyState, ErrorState, LoadingSkeleton } from '@/components/common/states';
import { KnowledgeHeader } from '@/features/sources/knowledge-header';
import { useGraphState } from './graph-state';
import { useGraph } from './use-graph';
import { GraphFilters } from './graph-filters';
import { GraphToolbar } from './graph-toolbar';
import { GraphCanvas } from './graph-canvas';
import { GraphList } from './graph-list';
import { GraphMobile } from './graph-mobile';
import { RelationshipInspector } from './relationship-inspector';
import { EntityInspector } from './entity-inspector';

/** Knowledge → Map (UI.md v2 §4.9, formerly Graph): filters · canvas or list · inspector. */
export default function GraphPage() {
  const { state, set } = useGraphState();
  const { data: projects = [] } = useProjectsList();
  const graph = useGraph({ include_candidates: true, depth: state.depth, focus: state.focus ?? undefined, source_id: state.source ?? undefined });
  const project = projects.find((p) => p.id === state.project);

  const view = useMemo(() => {
    if (!graph.data) return null;
    const since = state.since ? now().getTime() - Number(state.since) * 86_400_000 : 0;
    const nodes = graph.data.nodes.filter((n) => state.types.includes(n.entity_type));
    const ids = new Set(nodes.map((n) => n.id));
    const edges = graph.data.edges
      .filter((e) => (e.status === 'candidate' ? state.candidates : state.confirmed))
      .filter((e) => Date.parse(e.extracted_at) >= since)
      .filter((e) => state.view === 'graph' || state.relations.includes(e.relation_type))
      .filter((e) => ids.has(e.from_entity_id) && ids.has(e.to_entity_id))
      .toSorted((a, b) => (a.status === b.status ? 0 : a.status === 'candidate' ? -1 : 1));
    return { nodes, edges, entities: new Map(graph.data.nodes.map((n) => [n.id, n])) };
  }, [graph.data, state.types, state.candidates, state.confirmed, state.since, state.relations, state.view]);

  const select = (id: string | null) => set({ sel: id });
  const selectedEntity = state.selected?.startsWith('ent_') ? view?.entities.get(state.selected) : undefined;
  const names = new Map([...(view?.entities.values() ?? [])].map((n) => [n.id, n.canonical_name]));

  const inspector = state.selected?.startsWith('rel_') ? (
    <RelationshipInspector key={state.selected} id={state.selected} onClose={() => select(null)} />
  ) : selectedEntity && view ? (
    <EntityInspector entity={selectedEntity} edges={graph.data?.edges ?? []} names={names} onSelect={select} onFocus={() => set({ focus: selectedEntity.id, depth: '1' })} onClose={() => select(null)} />
  ) : (
    <EmptyState className="py-16" title="Select a node or edge" description="The inspector shows its provenance: evidence passages, confidence, and who created it." />
  );

  return (
    <div className="flex h-[calc(100dvh-var(--topbar-height)-80px)] flex-col md:h-[calc(100dvh-var(--topbar-height))]">
      <KnowledgeHeader />
      {graph.isPending ? (
        <LoadingSkeleton className="p-8" rows={6} label="Loading map…" />
      ) : graph.error ? (
        <ErrorState className="m-8" error={graph.error} onRetry={() => graph.refetch()} />
      ) : graph.data.nodes.length === 0 ? (
        <EmptyState icon={<Waypoints />} title="Your map builds as you add papers" description="Methods, datasets, and claims appear here once a source finishes indexing." action={<ButtonLink to="/knowledge/sources">Go to Sources</ButtonLink>} />
      ) : (
        <>
          <div className="md:hidden">
            <GraphMobile edges={view!.edges} entities={view!.entities} projectName={project?.name ?? 'Project'} onSelect={select} />
          </div>
          <div className="hidden min-h-0 flex-1 md:grid md:grid-cols-[minmax(0,1fr)_360px] xl:grid-cols-[300px_minmax(0,1fr)_400px]">
            <GraphFilters state={state} counts={graph.data.counts} set={set} className="hidden overflow-y-auto xl:flex" />
            <section aria-label={state.view === 'graph' ? 'Map canvas' : 'Relationship list'} className="flex min-h-0 min-w-0 flex-col">
              <GraphToolbar state={state} set={set} focusName={graph.data.focus?.canonical_name ?? null} projectName={project?.name ?? null} nodeCount={view!.nodes.length} edgeCount={view!.edges.length} />
              <div className="min-h-0 flex-1">
                {state.view === 'graph' ? (
                  <GraphCanvas nodes={view!.nodes} edges={view!.edges} selected={state.selected} find={state.find} onSelect={select} onExpand={(id) => set({ focus: id, depth: '1' })} />
                ) : (
                  <GraphList edges={view!.edges} entities={view!.entities} selected={state.selected} page={state.page} onSelect={select} onPage={(p) => set({ page: String(p) })} />
                )}
              </div>
            </section>
            <aside aria-label="Inspector" className="min-h-0 overflow-hidden border-l border-subtle bg-app">
              {inspector}
            </aside>
          </div>
          <Dialog open={Boolean(state.selected) && typeof window !== 'undefined' && window.innerWidth < 768} onOpenChange={(o) => !o && select(null)} title="Relationship" className="md:hidden">
            {inspector}
          </Dialog>
        </>
      )}
    </div>
  );
}
