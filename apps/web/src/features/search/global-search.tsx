import { useState, type KeyboardEvent } from 'react';
import { useNavigate } from 'react-router';
import { Dialog as DialogPrimitive } from 'radix-ui';
import { Search } from 'lucide-react';
import { Kbd } from '@/components/ui/primitives';
import { Spinner } from '@/components/ui/spinner';
import { SearchResults, flatResults } from './search-results';
import { resultHref, useSearch } from './use-search';

/** ⌘K / Ctrl+K palette: arrows move, Enter opens, Esc closes (UI.md §3). */
export default function GlobalSearch({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [active, setActive] = useState(0);
  const { data, isFetching } = useSearch(query);
  const flat = flatResults(query.trim() ? data : undefined);

  function onKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActive((i) => Math.min(i + 1, flat.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActive((i) => Math.max(i - 1, 0));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (flat[active]) {
        navigate(resultHref(flat[active]));
        onOpenChange(false);
      } else if (query.trim()) {
        navigate(`/search?q=${encodeURIComponent(query.trim())}`);
        onOpenChange(false);
      }
    }
  }

  return (
    <DialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-app/80" />
        <DialogPrimitive.Content aria-describedby={undefined} className="fixed top-[10vh] left-1/2 z-50 flex max-h-[76vh] w-[calc(100vw-32px)] max-w-3xl -translate-x-1/2 flex-col overflow-hidden rounded-card border border-control bg-elevated">
          <DialogPrimitive.Title className="sr-only">Search</DialogPrimitive.Title>
          <div className="flex items-center gap-3 border-b border-subtle px-5 py-4 focus-within:shadow-[inset_0_-2px_0_var(--accent-primary)]">
            <Search aria-hidden="true" className="size-5 text-fg-secondary" />
            <input
              autoFocus
              role="combobox"
              aria-expanded={flat.length > 0}
              aria-controls="gs-list"
              aria-activedescendant={flat.length ? `gs-opt-${active}` : undefined}
              aria-label="Search sources, entities, memories, conversations, and actions"
              name="global-search"
              autoComplete="off"
              spellCheck={false}
              value={query}
              onChange={(e) => { setQuery(e.target.value); setActive(0); }}
              onKeyDown={onKeyDown}
              placeholder="Search anything…"
              className="min-w-0 flex-1 bg-transparent text-xl text-fg outline-none"
            />
            {isFetching ? <Spinner className="text-fg-secondary" /> : null}
            {query.trim() && data ? <span className="text-sm text-fg-secondary tabular" aria-live="polite">{data.total} results</span> : null}
          </div>
          <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain p-3">
            {!query.trim() ? (
              <p className="px-3 py-6 text-base text-fg-secondary">Search sources, projects, entities, memories and decisions, conversations, and actions.</p>
            ) : data && data.total === 0 ? (
              <p className="px-3 py-6 text-base text-fg-secondary">No results for “{query}”. Try a paper title, a method, or a dataset.</p>
            ) : data ? (
              <SearchResults data={data} activeIndex={active} idPrefix="gs" onPick={() => onOpenChange(false)} />
            ) : null}
          </div>
          <div className="flex flex-wrap items-center gap-4 border-t border-subtle px-5 py-3 text-sm text-fg-secondary">
            <span className="flex items-center gap-1.5"><Kbd>↑</Kbd><Kbd>↓</Kbd> move</span>
            <span className="flex items-center gap-1.5"><Kbd>Enter</Kbd> open</span>
            <span className="flex items-center gap-1.5"><Kbd>Esc</Kbd> close</span>
            <span className="ml-auto">{data?.scope_label ?? 'Searching all of your workspace'}</span>
          </div>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}
