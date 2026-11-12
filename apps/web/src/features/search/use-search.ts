import { useDeferredValue } from 'react';
import { keepPreviousData, useQuery } from '@tanstack/react-query';
import type { SearchResult } from '@contracts/types';
import { search } from '@/services/search';
import { qk } from '@/hooks/query-keys';

export function useSearch(query: string) {
  const deferred = useDeferredValue(query.trim());
  return useQuery({ queryKey: qk.search(deferred), queryFn: () => search({ query: deferred }), enabled: deferred.length > 0, placeholderData: keepPreviousData });
}

/** Where a result opens. */
export function resultHref(r: SearchResult): string {
  switch (r.type) {
    case 'source':
      return `/knowledge/sources/${r.id}${r.page ? `?page=${r.page}` : ''}`;
    case 'entity':
      return `/knowledge/graph?focus=${r.id}&depth=1&sel=${r.id}&candidates=1`;
    case 'conversation':
      return `/assistant/${r.id}`;
    case 'action':
      return `/approvals/${r.id}`;
    case 'project':
      return `/projects/${r.id}`;
    case 'decision':
      return `/projects/prj_rag#${r.id}`;
    case 'memory':
      return `/knowledge/memory?status=all&q=${encodeURIComponent(r.title.slice(0, 30))}`;
  }
}
