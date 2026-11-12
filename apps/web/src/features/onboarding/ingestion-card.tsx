import { Check, Circle, FileText } from 'lucide-react';
import type { Source } from '@contracts/types';
import { cn } from '@/lib/cn';
import { formatBytes, plural } from '@/lib/format';
import { Spinner } from '@/components/ui/spinner';
import { StatusBadge } from '@/components/common/status-badge';

/** Parsing → Indexing → Extracting (UI.md v2 §4.3). */
const ORDER = ['queued', 'parsing', 'indexing', 'extracting', 'ready'] as const;

/** Upload progress with stage checklist (design: Onboarding 2). */
export function IngestionCard({ source }: { source: Source }) {
  const job = source.job;
  const stageIndex = source.status === 'failed' ? -1 : ORDER.indexOf(source.status as (typeof ORDER)[number]);
  const ratio = job?.progress ? job.progress.current / Math.max(1, job.progress.total) : 0;
  // Overall progress across stages: parsing 0–40 %, indexing 40–90 %, extracting 95 %, ready 100 %.
  const progress = Math.round(source.status === 'ready' ? 100 : source.status === 'extracting' ? 95 : source.status === 'indexing' ? 40 + ratio * 50 : source.status === 'parsing' ? ratio * 40 : 2);
  const steps = [
    { label: 'Uploaded', state: 'done' as const },
    { label: source.page_count && stageIndex > 1 ? `Parsed ${plural(source.page_count, 'page')}` : 'Parsing pages', state: stageIndex > 1 ? ('done' as const) : stageIndex === 1 ? ('active' as const) : ('pending' as const) },
    { label: 'Indexing', state: stageIndex > 2 ? ('done' as const) : stageIndex === 2 ? ('active' as const) : ('pending' as const) },
    { label: 'Extracting methods, datasets, and claims', state: stageIndex > 3 ? ('done' as const) : stageIndex === 3 ? ('active' as const) : ('pending' as const) },
  ];
  const detail =
    job?.progress && source.status === 'indexing'
      ? `Embedding ${job.progress.current} of ${job.progress.total} chunks${job.eta_seconds ? ` · about ${job.eta_seconds} seconds left` : ''}`
      : job?.progress && source.status === 'parsing'
        ? `Parsing page ${job.progress.current} of ${job.progress.total}`
        : source.status === 'queued'
          ? 'Waiting for a worker…'
          : source.status === 'ready'
            ? `${plural(source.chunk_count ?? 0, 'passage')} indexed`
            : (job?.error_message ?? '');

  return (
    <div className="rounded-card border border-subtle bg-surface p-6">
      <div className="flex items-start gap-4">
        <FileText aria-hidden="true" className="mt-0.5 size-5 shrink-0 text-fg-secondary" />
        <div className="min-w-0 flex-1">
          <p className="truncate font-semibold text-fg">{source.file_name}</p>
          <p className="text-sm text-fg-secondary">
            {formatBytes(source.size_bytes)}
            {source.page_count ? ` · ${plural(source.page_count, 'page')}` : ''}
          </p>
        </div>
        <StatusBadge status={source.status} label={source.status === 'indexing' ? 'Indexing…' : undefined} />
      </div>
      <div className="mt-5 h-1.5 overflow-hidden rounded-full bg-elevated" role="progressbar" aria-label="Ingestion progress" aria-valuenow={progress} aria-valuemin={0} aria-valuemax={100}>
        <div className={cn('h-full rounded-full transition-[width] duration-500', source.status === 'ready' ? 'bg-knowledge' : 'bg-accent')} style={{ width: `${progress}%` }} />
      </div>
      <p aria-live="polite" className="mt-3 text-sm text-fg-secondary">
        {detail}
      </p>
      <ul className="mt-4 grid grid-cols-2 gap-3 text-sm md:grid-cols-4">
        {steps.map((s) => (
          <li key={s.label} className={cn('flex items-center gap-2', s.state === 'pending' ? 'text-fg-muted' : s.state === 'active' ? 'font-medium text-fg' : 'text-fg-secondary')}>
            {s.state === 'done' ? <Check aria-hidden="true" className="size-4 text-knowledge" /> : s.state === 'active' ? <Spinner className="text-accent" /> : <Circle aria-hidden="true" className="size-4" />}
            {s.label}
            <span className="sr-only">{s.state === 'done' ? ' (done)' : s.state === 'active' ? ' (in progress)' : ' (pending)'}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
