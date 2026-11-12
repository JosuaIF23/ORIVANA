import { Grid3x3 } from 'lucide-react';
import { useProjectsList } from '@/hooks/use-data';
import { useIsMobile } from '@/hooks/use-media-query';
import { ButtonLink } from '@/components/ui/button';
import { Dialog } from '@/components/ui/dialog';
import { EmptyState, ErrorState, LoadingSkeleton } from '@/components/common/states';
import { useToast } from '@/components/common/toast';
import { KnowledgeHeader } from '@/features/sources/knowledge-header';
import { usePreferences } from '@/features/onboarding/use-onboarding';
import { MatrixGrid } from './matrix-grid';
import { MatrixInspector } from './matrix-inspector';
import { MatrixMobile } from './matrix-mobile';
import { MatrixToolbar } from './matrix-toolbar';
import { matrixCsv, useMatrix, useMatrixState, useVisibleAxes } from './use-matrix';

/** Knowledge → Matrix (UI.md §4.7): methods × datasets with visible gaps, and an evidence inspector. */
export default function MatrixPage() {
  const { data: prefs } = usePreferences();
  const { data: projects = [] } = useProjectsList();
  const { state, set } = useMatrixState(prefs?.default_project_id ?? projects[0]?.id ?? null);
  const matrix = useMatrix({ project_id: state.project ?? undefined, include_candidates: state.candidates, year_from: state.from, year_to: state.to });
  const { methods, datasets } = useVisibleAxes(matrix.data, state.q);
  const isMobile = useIsMobile();
  const toast = useToast();
  const project = projects.find((p) => p.id === state.project);
  const select = (m: string, d: string) => set({ cell: `${m}|${d}` });
  const close = () => set({ cell: null });

  function exportCsv() {
    if (!matrix.data) return;
    const blob = new Blob([matrixCsv(matrix.data, methods, datasets)], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = Object.assign(document.createElement('a'), { href: url, download: `matrix-${(project?.name ?? 'workspace').toLowerCase().replaceAll(' ', '-')}.csv` });
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Matrix exported as CSV');
  }

  const inspector = <MatrixInspector key={`${state.method}|${state.dataset}`} methodId={state.method} datasetId={state.dataset} includeCandidates={state.candidates} onClose={close} />;
  const gaps = matrix.data?.gap_count ?? 0;

  return (
    <div className="flex min-h-[calc(100dvh-var(--topbar-height))] flex-col">
      <KnowledgeHeader />
      <div className="grid min-h-0 flex-1 md:grid-cols-[minmax(0,1fr)_360px]">
        <section aria-labelledby="matrix-title" className="min-w-0 px-4 py-6 md:px-8">
          <div className="flex flex-wrap items-baseline gap-x-4 gap-y-1">
            <h2 id="matrix-title" className="text-lg font-semibold text-fg">
              Matrix
            </h2>
            <p className="text-sm text-fg-secondary">Which methods were tested on which datasets in your collection, and where the gaps are.</p>
          </div>
          <div className="mt-5">
            <MatrixToolbar projects={projects} state={state} set={set} onExport={exportCsv} canExport={Boolean(matrix.data?.methods.length)} />
          </div>
          {matrix.isPending ? (
            <LoadingSkeleton className="mt-8" rows={5} label="Loading matrix…" />
          ) : matrix.error ? (
            <ErrorState className="mt-8" error={matrix.error} onRetry={() => matrix.refetch()} />
          ) : matrix.data.methods.length === 0 ? (
            <EmptyState
              className="mt-8 rounded-card border border-dashed border-subtle"
              icon={<Grid3x3 />}
              title="The matrix fills in as papers are extracted"
              description="Import or upload papers to start. Methods and datasets appear once a paper finishes extraction."
              action={<ButtonLink to="/knowledge/sources?upload=1">Add papers</ButtonLink>}
            />
          ) : (
            <>
              <p className="mt-6 text-sm text-fg-secondary" aria-live="polite">
                {methods.length} methods × {datasets.length} datasets · {matrix.data.papers.length} papers ·{' '}
                <span className="text-fg">
                  {gaps} gap{gaps === 1 ? '' : 's'}
                </span>
                {state.candidates ? ' · including candidates' : ' · confirmed relationships only'}
              </p>
              <MatrixLegend />
              <div className="mt-4">
                {isMobile ? (
                  <MatrixMobile data={matrix.data} methods={methods} datasets={datasets} onSelect={select} />
                ) : (
                  <MatrixGrid data={matrix.data} methods={methods} datasets={datasets} projectName={project?.name ?? 'your collection'} selected={{ method: state.method, dataset: state.dataset }} onSelect={select} />
                )}
              </div>
              <ol className="mt-5 flex flex-wrap gap-x-5 gap-y-1 text-sm text-fg-secondary" aria-label="Papers in the matrix">
                {matrix.data.papers.map((p) => (
                  <li key={p.ordinal}>
                    <span className="font-semibold text-accent tabular">[{p.ordinal}]</span> {p.label}
                  </li>
                ))}
              </ol>
            </>
          )}
        </section>
        <aside aria-label="Cell evidence" className="hidden min-h-0 border-l border-subtle bg-app md:block">
          <div className="sticky top-[var(--topbar-height)] h-[calc(100dvh-var(--topbar-height))]">{inspector}</div>
        </aside>
      </div>
      <Dialog open={isMobile && Boolean(state.method)} onOpenChange={(o) => !o && close()} title="Cell evidence" className="md:hidden">
        {inspector}
      </Dialog>
    </div>
  );
}

/** Filled, candidate, and gap cells differ by border style and text, not colour alone. */
function MatrixLegend() {
  return (
    <ul aria-label="Legend" className="mt-3 flex flex-wrap gap-x-5 gap-y-2 text-xs text-fg-secondary">
      <li className="flex items-center gap-2">
        <span aria-hidden="true" className="inline-block h-4 w-6 rounded-badge border border-subtle bg-surface" />
        Filled · number of papers
      </li>
      <li className="flex items-center gap-2">
        <span aria-hidden="true" className="inline-block h-4 w-6 rounded-badge border border-dashed border-warning/70 bg-warning/5" />
        Candidate (dashed)
      </li>
      <li className="flex items-center gap-2">
        <span aria-hidden="true" className="inline-flex h-4 w-6 items-center justify-center rounded-badge border border-dashed border-subtle text-fg-muted">—</span>
        Gap · no evidence in your collection
      </li>
    </ul>
  );
}
