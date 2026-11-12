import type { ReactNode } from 'react';
import { Bookmark, ExternalLink, Search, ShieldCheck, TriangleAlert, Upload, Wrench } from 'lucide-react';
import type { AuditCategory } from '@contracts/types';
import { cn } from '@/lib/cn';

export const CATEGORY: Record<AuditCategory, { label: string; icon: ReactNode }> = {
  ingestion: { label: 'Ingestion', icon: <Upload /> },
  retrieval: { label: 'Retrieval', icon: <Search /> },
  memory: { label: 'Memory', icon: <Bookmark /> },
  tool_calls: { label: 'Tool calls', icon: <Wrench /> },
  approvals: { label: 'Approvals', icon: <ShieldCheck className="text-warning" /> },
  external_actions: { label: 'External actions', icon: <ExternalLink /> },
  errors: { label: 'Errors', icon: <TriangleAlert className="text-danger" /> },
};

const ORDER = Object.keys(CATEGORY) as AuditCategory[];

/** Toggle chips; none selected = all categories. */
export function CategoryChips({ selected, counts, onChange }: { selected: AuditCategory[]; counts?: Record<AuditCategory, number>; onChange: (next: AuditCategory[]) => void }) {
  return (
    <div role="group" aria-label="Filter by category" className="flex flex-wrap gap-3">
      {ORDER.map((c) => {
        const on = selected.includes(c);
        return (
          <button
            key={c}
            type="button"
            aria-pressed={on}
            onClick={() => onChange(on ? selected.filter((x) => x !== c) : [...selected, c])}
            className={cn('inline-flex h-10 items-center gap-2 rounded-full border px-4 text-sm transition-colors [&_svg]:size-4', on ? 'border-accent bg-accent/15 text-fg' : 'border-accent/40 text-fg hover:border-accent')}
          >
            <span aria-hidden="true" className="text-accent">{CATEGORY[c].icon}</span>
            {CATEGORY[c].label}
            {counts ? <span className="text-fg-secondary tabular">{counts[c]}</span> : null}
          </button>
        );
      })}
    </div>
  );
}
