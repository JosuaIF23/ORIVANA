import { useState } from 'react';
import { useSearchParams } from 'react-router';
import { Input } from '@/components/ui/field';
import { PageHeader } from '@/components/common/page-header';
import { EmptyState, ErrorState, LoadingSkeleton } from '@/components/common/states';
import { SearchResults } from './search-results';
import { useSearch } from './use-search';

/** Full search results page (/search?q=…), same grouped results as the palette. */
export default function SearchPage() {
  const [params, setParams] = useSearchParams();
  const [q, setQ] = useState(params.get('q') ?? '');
  const { data, isPending, error, refetch, fetchStatus } = useSearch(q);
  return (
    <div className="mx-auto flex max-w-[960px] flex-col gap-6">
      <PageHeader title="Search" description={data?.scope_label ?? 'Searching all of your workspace'} />
      <form role="search" onSubmit={(e) => { e.preventDefault(); setParams(q ? { q } : {}, { replace: true }); }}>
        <label htmlFor="search-page-input" className="sr-only">Search</label>
        <Input id="search-page-input" type="search" name="q" autoComplete="off" spellCheck={false} className="h-12 text-lg" placeholder="Search anything…" value={q} onChange={(e) => setQ(e.target.value)} />
      </form>
      {!q.trim() ? (
        <EmptyState title="Search your workspace" description="Find sources, projects, entities, memories and decisions, conversations, and actions." />
      ) : isPending && fetchStatus !== 'idle' ? (
        <LoadingSkeleton rows={5} label="Searching…" />
      ) : error ? (
        <ErrorState error={error} onRetry={() => refetch()} />
      ) : data && data.total === 0 ? (
        <EmptyState title={`No results for “${q}”`} description="Try a paper title, a method, a dataset, or a decision code like D-04." />
      ) : data ? (
        <>
          <p aria-live="polite" className="text-sm text-fg-secondary">{data.total} results</p>
          <SearchResults data={data} activeIndex={-1} idPrefix="sp" />
        </>
      ) : null}
    </div>
  );
}
