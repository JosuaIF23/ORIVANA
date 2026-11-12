import { useCallback, useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'react-router';
import { Library, Upload } from 'lucide-react';
import type { SourceListQuery, SourceStatus, SourceType } from '@contracts/types';
import { SOURCES_PAGE_SIZE } from '@/services/sources';
import { useProjectsList } from '@/hooks/use-data';
import { Button } from '@/components/ui/button';
import { UploadDropzone } from '@/components/common/upload-dropzone';
import { EmptyState, ErrorState, InlineAlert, LoadingSkeleton } from '@/components/common/states';
import { KnowledgeHeader } from './knowledge-header';
import { SourceFilters } from './source-filters';
import { SourceTable } from './source-table';
import { SourceCards } from './source-cards';
import { useSources, useUploadSource } from './use-sources';
import { ZoteroImportDialog } from '@/features/zotero/zotero-import-dialog';
import { useZoteroConnection } from '@/features/zotero/use-zotero';

/** Knowledge → Sources library (UI.md §4.7). Filters, view and page live in the URL. */
export default function SourcesPage() {
  const [params, setParams] = useSearchParams();
  const zoneRef = useRef<HTMLDivElement>(null);
  const { data: projects = [] } = useProjectsList();
  const page = Math.max(1, Number(params.get('page') ?? 1));
  const projectId = params.get('project') ?? '';
  const query: SourceListQuery = {
    q: params.get('q') ?? undefined,
    project_id: projectId || undefined,
    status: (params.get('status') as SourceStatus) || undefined,
    type: (params.get('type') as SourceType) || undefined,
    cursor: page > 1 ? String((page - 1) * SOURCES_PAGE_SIZE) : undefined,
  };
  const view = params.get('view') === 'list' ? 'list' : 'table';
  const { data, isPending, error, refetch, isPlaceholderData } = useSources(query);
  const upload = useUploadSource();
  const { connection: zotero } = useZoteroConnection();
  const [importing, setImporting] = useState(params.get('import') === 'zotero');
  const project = projects.find((p) => p.id === projectId);
  const uploadProject = project ?? null;

  useEffect(() => {
    if (params.get('upload')) zoneRef.current?.querySelector('button')?.focus();
  }, [params]);

  const update = useCallback((key: string, value: string | null) => {
    setParams((p) => {
      if (value) p.set(key, value);
      else p.delete(key);
      if (key !== 'page') p.delete('page');
      p.delete('upload');
      return p;
    }, { replace: true });
  }, [setParams]);

  const ragCount = data && project ? ` · ${data.total} in ${project.name}` : '';

  return (
    <div>
      <KnowledgeHeader />
      <div className="flex flex-col gap-6 px-4 py-8 md:px-10">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <h2 className="text-xl font-semibold text-fg">
            Sources <span className="ml-3 text-sm font-normal text-fg-secondary">{data ? `${data.workspace_total} in workspace${ragCount}` : ''}</span>
          </h2>
          <div className="flex flex-wrap gap-3">
            {/* Import from Zotero is primary once Zotero is connected (UI.md §4.6). */}
            <Button variant={zotero ? 'primary' : 'secondary'} size="lg" onClick={() => setImporting(true)}>
              <Library aria-hidden="true" />
              Import from Zotero
            </Button>
            <Button variant={zotero ? 'secondary' : 'primary'} size="lg" onClick={() => zoneRef.current?.querySelector('button')?.click()}>
              <Upload aria-hidden="true" />
              Upload
            </Button>
          </div>
        </div>
        <div ref={zoneRef}>
          <UploadDropzone onFile={(file) => upload.mutate({ file_name: file.name, size_bytes: file.size, project_id: uploadProject?.id ?? null })} disabled={upload.isPending}>
            <span>
              <strong className="font-semibold text-fg">Drop PDF, Markdown, or TXT files</strong> or click to browse
              {uploadProject ? ` · they’ll be added to ${uploadProject.name}` : ''}
            </span>
          </UploadDropzone>
        </div>
        {upload.error ? (
          <InlineAlert tone="danger" title="Upload failed" live>
            {upload.error.message}
          </InlineAlert>
        ) : upload.isSuccess ? (
          <p role="status" className="text-sm text-fg-secondary">
            {upload.data.source.title} uploaded — processing has started.
          </p>
        ) : null}
        {zotero ? <p className="-mt-3 text-sm text-fg-secondary">Zotero is read only: ORIVANA imports and syncs your items but never changes your Zotero library.</p> : null}
        <SourceFilters params={params} projects={projects} view={view} onChange={update} />
        {isPending ? (
          <LoadingSkeleton rows={6} label="Loading sources…" />
        ) : error ? (
          <ErrorState error={error} onRetry={() => refetch()} />
        ) : data.items.length === 0 ? (
          <EmptyState title="No sources match" description="Change the filters, or upload a PDF, Markdown, or TXT file." />
        ) : (
          <div aria-busy={isPlaceholderData} className={isPlaceholderData ? 'opacity-70' : undefined}>
            {view === 'table' ? <SourceTable sources={data.items} highlight={params.get('highlight')} /> : <SourceCards sources={data.items} />}
            <nav aria-label="Pagination" className="mt-6 flex items-center justify-between">
              <p className="text-sm text-fg-secondary">
                Showing {(page - 1) * SOURCES_PAGE_SIZE + data.items.length} of {data.total}
              </p>
              <div className="flex gap-3">
                <Button variant="ghost" disabled={page === 1} onClick={() => update('page', String(page - 1))}>
                  Previous
                </Button>
                <Button disabled={!data.next_cursor} onClick={() => update('page', String(page + 1))}>
                  Next
                </Button>
              </div>
            </nav>
          </div>
        )}
      </div>
      {importing ? <ZoteroImportDialog open onOpenChange={setImporting} defaultProjectId={projectId || null} /> : null}
    </div>
  );
}
