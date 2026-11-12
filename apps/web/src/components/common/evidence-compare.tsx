import type { ReactNode } from 'react';
import { Link } from 'react-router';
import { cn } from '@/lib/cn';
import { formatDate } from '@/lib/format';
import { evidenceHref } from '@/lib/evidence-link';
import { EvidencePassage } from './citation';
import { StatusBadge } from './status-badge';

export interface CompareItem {
  key: string;
  source_id: string;
  source_label: string;
  source_title: string;
  chunk_id: string;
  page: number;
  section: string;
  passage: string;
  char_start: number;
  char_end: number;
  /** Zotero import date, shown as "Imported …". */
  imported_at?: string | null;
  /** Relationship status; candidates get a dashed border and badge. */
  status?: string;
  /** Marks the newly added evidence (Decision Impact). */
  isNew?: boolean;
}

interface Column {
  title: string;
  icon: ReactNode;
  tone: 'knowledge' | 'danger';
  items: CompareItem[];
  empty: string;
}

/**
 * Two-column evidence comparison (UI.md §5): Supports | Contradicts, or old
 * vs new evidence. Each column has a text heading and icon, never colour alone.
 */
export function EvidenceCompare({ left, right, className, back }: { left: Column; right: Column; className?: string; back?: { href: string; label: string } }) {
  return (
    <div className={cn('@container', className)}>
      <div className="grid gap-4 @2xl:grid-cols-2">
      <CompareColumn column={left} back={back} />
      <CompareColumn column={right} back={back} />
      </div>
    </div>
  );
}

function CompareColumn({ column, back }: { column: Column; back?: { href: string; label: string } }) {
  return (
    <section aria-label={column.title} className="min-w-0">
      <h3 className={cn('flex items-center gap-2 text-sm font-semibold [&_svg]:size-4', column.tone === 'knowledge' ? 'text-knowledge' : 'text-danger')}>
        <span aria-hidden="true">{column.icon}</span>
        {column.title}
        <span className="font-normal text-fg-secondary">· {column.items.length}</span>
      </h3>
      {column.items.length === 0 ? (
        <p className="mt-3 rounded-card border border-dashed border-subtle p-4 text-sm text-fg-muted">{column.empty}</p>
      ) : (
        <ul className="mt-3 flex flex-col gap-3">
          {column.items.map((item) => (
            <li
              key={item.key}
              className={cn(
                'rounded-card border bg-surface p-4',
                item.status === 'candidate' ? 'border-dashed border-warning/60' : 'border-subtle',
                item.isNew && 'border-l-4 border-l-danger',
              )}
            >
              <div className="flex flex-wrap items-center gap-2">
                <p className="text-sm font-semibold text-fg">{item.source_label}</p>
                {item.isNew ? <span className="rounded-badge border border-danger/60 px-1.5 text-xs font-medium text-danger">New</span> : null}
                {item.status === 'candidate' ? <StatusBadge status="candidate" /> : null}
              </div>
              <p className="mt-1 text-sm text-fg-secondary">
                {item.source_title} · p. {item.page} · §{item.section}
                {item.imported_at ? ` · Imported from Zotero ${formatDate(item.imported_at)}` : ''}
              </p>
              <EvidencePassage className="mt-2 text-sm" passage={item.passage} start={item.char_start} end={item.char_end} />
              <Link
                to={evidenceHref(item, back)}
                className="mt-2 inline-block text-sm text-accent underline underline-offset-4 hover:text-fg"
              >
                Open in document · p. {item.page}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
