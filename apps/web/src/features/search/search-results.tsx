import { Link } from 'react-router';
import type { SearchResponse } from '@contracts/types';
import { cn } from '@/lib/cn';
import { formatDayMonth, formatRelativeDay } from '@/lib/format';
import { ResultIcon } from '@/components/common/entity-icon';
import { resultHref } from './use-search';

/** Results grouped by type; each row shows type icon + label, title, project/match, date (UI.md §3). */
export function SearchResults({ data, activeIndex, idPrefix, onPick }: { data: SearchResponse; activeIndex: number; idPrefix: string; onPick?: () => void }) {
  let index = -1;
  return (
    <div role="listbox" id={`${idPrefix}-list`} aria-label="Search results" className="flex flex-col gap-4">
      {data.groups.map((g) => (
        <div key={g.key} role="group" aria-labelledby={`${idPrefix}-${g.key}`}>
          <p id={`${idPrefix}-${g.key}`} className="px-3 pb-1 text-sm font-medium text-fg-secondary">{g.label}</p>
          {g.results.map((r) => {
            index += 1;
            const active = index === activeIndex;
            return (
              <Link
                key={r.id}
                id={`${idPrefix}-opt-${index}`}
                role="option"
                aria-selected={active}
                to={resultHref(r)}
                onClick={onPick}
                tabIndex={-1}
                className={cn('grid grid-cols-[150px_minmax(0,1fr)_auto] items-center gap-4 rounded-card px-3 py-3', active ? 'bg-elevated' : 'hover:bg-elevated/60')}
              >
                <span className="flex items-center gap-2 text-sm text-fg-secondary">
                  <ResultIcon icon={r.icon} />
                  {r.type_label}
                </span>
                <span className="min-w-0">
                  <span className="block truncate text-base text-fg">{r.title}</span>
                  <span className="block truncate text-sm text-fg-secondary">{r.subtitle}</span>
                </span>
                <span className="text-sm text-fg-secondary">{formatRelativeDay(r.updated_at) === 'today' ? 'Today' : formatDayMonth(r.updated_at)}</span>
              </Link>
            );
          })}
        </div>
      ))}
    </div>
  );
}

export function flatResults(data: SearchResponse | undefined) {
  return data?.groups.flatMap((g) => g.results) ?? [];
}
