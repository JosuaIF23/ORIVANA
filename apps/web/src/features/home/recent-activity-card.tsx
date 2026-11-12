import type { ActorType } from '@contracts/types';
import type { AuditEvent } from '@contracts/types';
import { formatTime } from '@/lib/format';
import { useAuditEvents } from '@/hooks/use-data';
import { AuditSummary } from '@/components/common/audit-summary';
import { LoadingSkeleton, ErrorState } from '@/components/common/states';
import { HomeCard } from './home-card';

const ACTOR: Record<ActorType, string> = { user: 'You', agent: 'Agent', system: 'System', external_client: 'External client' };

function lowerFirst(text: string) {
  return text.charAt(0).toLowerCase() + text.slice(1);
}

export function RecentActivityCard() {
  const { data, isPending, error, refetch } = useAuditEvents({ limit: 4 });
  return (
    <HomeCard id="recent-activity" title="Recent activity" link={{ to: '/activity', label: 'Activity' }}>
      {isPending ? (
        <LoadingSkeleton rows={4} label="Loading activity…" />
      ) : error ? (
        <ErrorState error={error} onRetry={() => refetch()} />
      ) : (
        <ol className="divide-y divide-subtle">
          {data.items.slice(0, 4).map((e) => (
            <ActivityLine key={e.id} event={e} />
          ))}
        </ol>
      )}
    </HomeCard>
  );
}

function ActivityLine({ event }: { event: AuditEvent }) {
  return (
    <li className="flex gap-6 py-3">
      <time dateTime={event.created_at} className="w-12 shrink-0 text-sm text-fg-muted tabular">
        {formatTime(event.created_at)}
      </time>
      <p className="min-w-0 text-base text-fg">
        <span className="text-fg-secondary">{ACTOR[event.actor_type]}</span> <AuditSummary event={{ ...event, summary: lowerFirst(event.summary) }} />
        {event.result === 'failed' ? <span className="text-danger"> · error</span> : null}
      </p>
    </li>
  );
}
