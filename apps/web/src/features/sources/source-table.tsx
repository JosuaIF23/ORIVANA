import { useState } from 'react';
import { Link } from 'react-router';
import { RotateCw, TriangleAlert } from 'lucide-react';
import type { Source } from '@contracts/types';
import { cn } from '@/lib/cn';
import { formatAdded, formatTime } from '@/lib/format';
import { Button } from '@/components/ui/button';
import { SourceTypeBadge } from '@/components/common/source-type-badge';
import { formatAgo } from '@/lib/format';
import { RemovedInZotero } from './removed-in-zotero';
import { StatusBadge } from '@/components/common/status-badge';
import { DeleteSourceDialog } from './delete-source-dialog';
import { SourceRowMenu } from './source-row-menu';
import { useReprocessSource } from './use-sources';

export function statusDetail(s: Source): string | null {
  const p = s.job?.progress;
  if (s.status === 'indexing' && p) return `Embedding ${p.current} of ${p.total} chunks`;
  if (s.status === 'parsing' && p) return `Page ${p.current} of ${p.total}`;
  return null;
}

export function bylineOf(s: Source): string {
  if (s.zotero) return [s.authors, s.year, s.zotero.collection_name, `last synced ${formatAgo(s.zotero.last_synced_at)}`].filter(Boolean).join(' · ');
  if (s.authors) return [s.authors, s.year].filter(Boolean).join(' · ');
  if (s.section_count) return `${s.section_count} sections`;
  return s.type.toUpperCase();
}

/** Source library table (design 6 · Knowledge → Sources). */
export function SourceTable({ sources, highlight }: { sources: Source[]; highlight: string | null }) {
  const [deleting, setDeleting] = useState<Source | null>(null);
  return (
    <div className="overflow-x-auto rounded-card border border-subtle">
      <table className="w-full min-w-[920px] border-collapse text-left">
        <thead>
          <tr className="border-b border-subtle bg-surface text-sm text-fg-secondary">
            <th scope="col" className="w-28 px-4 py-3 font-medium">Type</th>
            <th scope="col" className="px-2 py-3 font-medium">Title</th>
            <th scope="col" className="px-4 py-3 font-medium">Project</th>
            <th scope="col" className="px-4 py-3 font-medium">Status</th>
            <th scope="col" className="px-4 py-3 text-right font-medium">Pages</th>
            <th scope="col" className="px-4 py-3 font-medium">Added</th>
            <th scope="col" className="w-28 px-4 py-3">
              <span className="sr-only">Actions</span>
            </th>
          </tr>
        </thead>
        <tbody>
          {sources.map((s) => (
            <SourceRow key={s.id} source={s} highlighted={s.id === highlight} onDelete={() => setDeleting(s)} />
          ))}
        </tbody>
      </table>
      {deleting ? <DeleteSourceDialog source={deleting} open onOpenChange={(o) => !o && setDeleting(null)} /> : null}
    </div>
  );
}

function SourceRow({ source: s, highlighted, onDelete }: { source: Source; highlighted: boolean; onDelete: () => void }) {
  const reprocess = useReprocessSource();
  const failed = s.status === 'failed';
  const detail = statusDetail(s);
  const exhausted = failed && s.job && s.job.attempts >= s.job.max_attempts;
  return (
    <tr className={cn('border-b border-subtle last:border-b-0', failed ? 'bg-danger/5' : s.zotero?.removed_in_zotero ? 'bg-warning/5' : 'bg-app hover:bg-surface/60', highlighted && 'outline outline-1 -outline-offset-1 outline-accent')}>
      <td className="px-4 py-4 align-top">
        <SourceTypeBadge type={s.type} />
      </td>
      <td className="px-2 py-4 align-top">
        <Link to={`/knowledge/sources/${s.id}`} className="text-base font-medium text-fg hover:underline hover:underline-offset-4">
          {s.title}
        </Link>
        {failed && s.job?.error_message ? (
          <p className="mt-1 flex max-w-xl gap-2 text-sm text-danger">
            <TriangleAlert aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
            <span>
              {s.job.error_message} <span className="text-fg-secondary">Attempt {s.job.attempts} of {s.job.max_attempts}{s.job.finished_at ? ` · ${formatTime(s.job.finished_at)}` : ''}</span>
            </span>
          </p>
        ) : (
          <p className="mt-0.5 text-sm text-fg-secondary">{bylineOf(s)}</p>
        )}
        {s.zotero?.removed_in_zotero ? <RemovedInZotero source={s} onDelete={onDelete} /> : null}
      </td>
      <td className="px-4 py-4 align-top text-sm whitespace-nowrap text-fg-secondary">{s.project_name ?? '—'}</td>
      <td className="px-4 py-4 align-top">
        <StatusBadge status={s.status} />
        {detail ? <p className="mt-1 text-sm text-fg-secondary tabular">{detail}</p> : null}
      </td>
      <td className="px-4 py-4 text-right align-top text-base text-fg tabular">{s.page_count ?? '—'}</td>
      <td className="px-4 py-4 align-top text-base whitespace-nowrap text-fg-secondary tabular">{formatAdded(s.created_at)}</td>
      <td className="px-4 py-3 text-right align-top">
        {failed ? (
          <Button size="sm" onClick={() => reprocess.mutate(s.id)} loading={reprocess.isPending} loadingText="Retrying…" disabled={Boolean(exhausted)} title={exhausted ? 'All attempts used — re-upload the file' : undefined}>
            <RotateCw aria-hidden="true" />
            Retry
          </Button>
        ) : (
          <SourceRowMenu source={s} onDelete={onDelete} onReprocess={() => reprocess.mutate(s.id)} />
        )}
        {reprocess.error ? <p role="alert" className="mt-1 text-left text-xs text-danger">{reprocess.error.message}</p> : null}
      </td>
    </tr>
  );
}
