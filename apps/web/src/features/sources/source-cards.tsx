import { Link } from 'react-router';
import type { Source } from '@contracts/types';
import { formatAdded, plural } from '@/lib/format';
import { ResultIcon } from '@/components/common/entity-icon';
import { StatusBadge } from '@/components/common/status-badge';
import { bylineOf, statusDetail } from './source-table';

/** List view: one SourceCard per source (UI.md §5 SourceCard). */
export function SourceCards({ sources }: { sources: Source[] }) {
  return (
    <ul className="grid gap-4 md:grid-cols-2">
      {sources.map((s) => (
        <li key={s.id}>
          <Link to={`/knowledge/sources/${s.id}`} className="flex h-full gap-4 rounded-card border border-subtle bg-surface p-5 hover:border-control">
            <ResultIcon icon={s.type === 'pdf' ? 'pdf' : 'markdown'} className="mt-1" />
            <div className="min-w-0 flex-1">
              <p className="truncate text-base font-medium text-fg">{s.title}</p>
              <p className="text-sm text-fg-secondary">{bylineOf(s)}</p>
              <p className="mt-3 text-sm text-fg-muted">
                {s.project_name ?? 'No project'} · {s.page_count ? plural(s.page_count, 'page') : '—'} · {formatAdded(s.created_at)}
              </p>
              {statusDetail(s) ? <p className="mt-1 text-sm text-fg-secondary">{statusDetail(s)}</p> : null}
            </div>
            <StatusBadge status={s.status} />
          </Link>
        </li>
      ))}
    </ul>
  );
}
