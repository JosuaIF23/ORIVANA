import { Link } from 'react-router';
import type { Source } from '@contracts/types';
import { formatRelativeDay, plural } from '@/lib/format';
import { ResultIcon } from '@/components/common/entity-icon';
import { StatusBadge } from '@/components/common/status-badge';
import { LoadingSkeleton, ErrorState } from '@/components/common/states';
import { useRecentSources, useReprocessSource } from '@/features/sources/use-sources';
import { HomeCard } from './home-card';
import { SOURCE_TYPE_LABEL } from '@/lib/labels';

const TYPE_LABEL = SOURCE_TYPE_LABEL;

export function RecentSourcesCard() {
  const { data, isPending, error, refetch } = useRecentSources();
  return (
    <HomeCard id="recent-sources" title="Recently added sources" link={{ to: '/knowledge/sources', label: 'Open library' }}>
      {isPending ? <LoadingSkeleton rows={4} label="Loading sources…" /> : error ? <ErrorState error={error} onRetry={() => refetch()} /> : (
        <ul className="divide-y divide-subtle">
          {data.map((s) => (
            <SourceRow key={s.id} source={s} />
          ))}
        </ul>
      )}
    </HomeCard>
  );
}

function SourceRow({ source }: { source: Source }) {
  const reprocess = useReprocessSource();
  const meta = [TYPE_LABEL[source.type], source.page_count ? plural(source.page_count, 'page') : null, formatRelativeDay(source.created_at)].filter(Boolean).join(' · ');
  return (
    <li className="flex items-center gap-4 py-3">
      <ResultIcon icon={source.type === 'pdf' ? 'pdf' : 'markdown'} className="text-fg-secondary" />
      <div className="min-w-0 flex-1">
        <Link to={`/knowledge/sources/${source.id}`} className="block truncate text-base text-fg hover:underline hover:underline-offset-4">
          {source.title}
        </Link>
        {source.status === 'failed' ? (
          <p className="text-sm text-danger">
            {source.job?.error_code === 'PDF_ENCRYPTED' ? 'Password-protected PDF' : 'Processing failed'} ·{' '}
            <button type="button" onClick={() => reprocess.mutate(source.id)} disabled={reprocess.isPending} className="rounded-badge text-fg underline underline-offset-4 hover:text-accent">
              {reprocess.isPending ? 'Retrying…' : 'Retry'}
            </button>
          </p>
        ) : (
          <p className="text-sm text-fg-secondary">{meta}</p>
        )}
      </div>
      <StatusBadge status={source.status} />
    </li>
  );
}
