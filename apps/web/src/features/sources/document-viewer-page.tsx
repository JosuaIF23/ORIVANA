import { Link, useParams, useSearchParams } from 'react-router';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { isApiError } from '@/services/core/http';
import { ErrorState, InlineAlert, LoadingSkeleton } from '@/components/common/states';
import { useConversation } from '@/features/assistant/use-assistant';
import { SectionOutline } from './section-outline';
import { PageView } from './page-view';
import { SourcePanel } from './source-panel';
import { CitationBanner } from './citation-banner';
import { useSource, useSourcePage } from './use-sources';
import { parseEvidenceParams } from '@/lib/evidence-link';

/**
 * Source detail / document viewer (UI.md §4.7). `?page=6&from=<conv>:<msg>:<n>`
 * opens the cited page and highlights the quoted passage.
 */
export default function DocumentViewerPage() {
  const { sourceId = '' } = useParams();
  const [params, setParams] = useSearchParams();
  const page = Math.max(1, Number(params.get('page') ?? 1));
  const [convId, msgId, ordinal] = (params.get('from') ?? '').split(':');
  const source = useSource(sourceId);
  const pageQuery = useSourcePage(sourceId, page);
  const conversation = useConversation(convId || undefined);
  const message = conversation.data?.messages.find((m) => m.id === msgId);
  const citation = message?.citations.find((c) => c.ordinal === Number(ordinal)) ?? null;
  const evidence = parseEvidenceParams(params);
  const pageCount = source.data?.page_count ?? pageQuery.data?.page_count ?? 1;

  function goTo(next: number) {
    setParams((p) => {
      p.set('page', String(Math.min(Math.max(1, next), pageCount)));
      return p;
    }, { replace: true });
  }

  if (source.isPending) return <LoadingSkeleton className="p-8" rows={6} label="Loading source…" />;
  if (source.error) return <ErrorState className="m-8" title="Source not available" error={source.error} onRetry={() => source.refetch()} />;
  const s = source.data;
  const processing = isApiError(pageQuery.error) && pageQuery.error.error.code === 'SOURCE_PROCESSING';

  return (
    <div className="flex min-h-[calc(100dvh-var(--topbar-height))] flex-col">
      <div className="flex flex-wrap items-center gap-4 border-b border-subtle px-4 py-4 md:px-8">
        <nav aria-label="Breadcrumb" className="min-w-0 flex-1">
          <ol className="flex items-center gap-2 truncate text-base">
            <li><Link to="/knowledge/sources" className="text-fg-secondary underline underline-offset-4 hover:text-fg">Knowledge</Link></li>
            <li aria-hidden="true" className="text-fg-muted">/</li>
            <li><Link to="/knowledge/sources" className="text-fg-secondary underline underline-offset-4 hover:text-fg">Sources</Link></li>
            <li aria-hidden="true" className="text-fg-muted">/</li>
            <li aria-current="page" className="truncate text-fg">{s.title}</li>
          </ol>
        </nav>
        <div className="flex items-center gap-2 text-base text-fg-secondary">
          <button type="button" aria-label="Previous page" disabled={page <= 1} onClick={() => goTo(page - 1)} className="flex size-9 items-center justify-center rounded-control hover:bg-elevated disabled:opacity-40">
            <ChevronLeft aria-hidden="true" className="size-5" />
          </button>
          <label htmlFor="page-input">Page</label>
          <input id="page-input" name="page" type="number" inputMode="numeric" min={1} max={pageCount} value={page} onChange={(e) => goTo(Number(e.target.value) || 1)} className="h-10 w-16 rounded-control border border-control bg-app text-center text-fg tabular" />
          <span>of {pageCount}</span>
          <button type="button" aria-label="Next page" disabled={page >= pageCount} onClick={() => goTo(page + 1)} className="flex size-9 items-center justify-center rounded-control hover:bg-elevated disabled:opacity-40">
            <ChevronRight aria-hidden="true" className="size-5" />
          </button>
        </div>
      </div>
      <div className="grid flex-1 lg:grid-cols-[260px_minmax(0,1fr)] xl:grid-cols-[300px_minmax(0,1fr)_380px]">
        <SectionOutline sections={s.sections} currentId={pageQuery.data?.section_id ?? null} onSelect={goTo} className="hidden lg:block" />
        <main className="min-w-0 px-4 py-6 md:px-8">
          <div className="mx-auto flex max-w-[760px] flex-col gap-6">
            {citation ? <CitationBanner citation={citation} conversationId={convId} conversationTitle={conversation.data?.title ?? ''} messageId={msgId} /> : null}
            {!citation && evidence.back ? (
              <div role="status" className="flex flex-wrap items-center gap-4 rounded-card border border-accent/50 bg-accent/5 px-5 py-4 text-base text-fg-secondary">
                <p className="min-w-0 flex-1">
                  Opened from <span className="text-fg">{evidence.back.label}</span>
                  {evidence.highlight ? ' · the passage is highlighted below.' : '.'}
                </p>
                <Link to={evidence.back.href} className="rounded-control text-base font-medium text-fg hover:underline hover:underline-offset-4">
                  Back
                </Link>
              </div>
            ) : null}
            {processing ? (
              <InlineAlert tone="warning" title="This source is still being processed" live>
                {isApiError(pageQuery.error) ? pageQuery.error.error.message : ''} The status updates on its own.
              </InlineAlert>
            ) : pageQuery.isPending ? (
              <LoadingSkeleton rows={8} label="Loading page…" />
            ) : pageQuery.error ? (
              <ErrorState error={pageQuery.error} onRetry={() => pageQuery.refetch()} />
            ) : pageQuery.data ? (
              <PageView page={pageQuery.data} highlight={citation && citation.page === page ? citation : evidence.highlight} />
            ) : (
              <InlineAlert tone="info" title="Preview not available">A page preview isn’t available for this file in the prototype. Metadata and ingestion history are on the right.</InlineAlert>
            )}
          </div>
        </main>
        <SourcePanel source={s} className="xl:col-start-3 lg:col-span-2 xl:col-span-1" />
      </div>
    </div>
  );
}
