import { formatAgo, plural } from '@/lib/format';
import { useConnectionsList } from '@/hooks/use-data';
import { ButtonLink } from '@/components/ui/button';
import { StatusBadge } from '@/components/common/status-badge';
import { LoadingSkeleton } from '@/components/common/states';
import { HomeCard } from './home-card';

export function ConnectorHealthCard() {
  const { data, isPending } = useConnectionsList();
  return (
    <HomeCard id="connector-health" title="Connector health" link={{ to: '/integrations', label: 'Integrations' }}>
      {isPending ? (
        <LoadingSkeleton rows={1} />
      ) : data?.connections.length ? (
        <ul className="flex flex-col gap-4">
          {data.connections.map((c) => (
            <li key={c.id} className="flex items-center gap-4">
              <span aria-hidden="true" className="flex size-10 items-center justify-center rounded-control bg-elevated font-semibold text-fg">
                G
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-base font-medium text-fg">GitHub</p>
                <p className="text-sm text-fg-secondary">
                  {plural(c.repositories.length, 'repository', 'repositories')} · last sync {formatAgo(c.last_sync_at)}
                </p>
              </div>
              <StatusBadge status={c.status} />
            </li>
          ))}
        </ul>
      ) : (
        <div className="flex items-center justify-between gap-4">
          <p className="text-base text-fg-secondary">No apps connected. GitHub is optional.</p>
          <ButtonLink to="/integrations" size="sm">
            Connect
          </ButtonLink>
        </div>
      )}
    </HomeCard>
  );
}
