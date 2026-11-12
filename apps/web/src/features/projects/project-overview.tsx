import { Link } from 'react-router';
import type { ProjectDetail } from '@contracts/types';
import { formatDayMonth, formatRelativeDay } from '@/lib/format';
import { useProposals } from '@/hooks/use-data';
import { Card } from '@/components/ui/primitives';
import { StatusBadge } from '@/components/common/status-badge';
import { LoadingSkeleton } from '@/components/common/states';
import { useSources } from '@/features/sources/use-sources';
import { useMemories } from '@/features/memory/use-memory';
import { DecisionTimeline } from './decision-timeline';
import { ProjectAlerts } from './project-knowledge';

/** Overview: status, recent changes, key decisions, timeline, pending actions, sources. */
export function ProjectOverview({ project }: { project: ProjectDetail }) {
  const decisions = useMemories({ decisions_only: true, project_id: project.id });
  const proposals = useProposals('pending');
  const sources = useSources({ project_id: project.id, limit: 3 });
  const key = (decisions.data?.items ?? []).filter((d) => d.status === 'confirmed').toSorted((a, b) => b.created_at.localeCompare(a.created_at)).slice(0, 3);
  const pending = (proposals.data?.items ?? []).filter((p) => p.project_id === project.id && p.status === 'awaiting_approval');

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
      <div className="flex min-w-0 flex-col gap-6">
        <div className="grid gap-6 md:grid-cols-2">
          <Card className="p-5">
            <h2 className="text-sm font-medium text-fg-secondary">Current status</h2>
            <p className="mt-3 text-base text-fg">{project.current_status.text}</p>
            {project.current_status.based_on_label ? <p className="mt-3 text-sm text-fg-secondary">{project.current_status.based_on_label}</p> : null}
          </Card>
          <Card className="p-5">
            <h2 className="text-sm font-medium text-fg-secondary">Recent changes</h2>
            <ul className="mt-3 flex flex-col gap-2 text-sm text-fg-secondary">
              {project.recent_changes.map((c) => (
                <li key={c.text}>
                  {formatRelativeDay(c.at) === 'today' ? 'Today' : formatDayMonth(c.at)} · <span className="text-fg">{c.text}</span>
                </li>
              ))}
            </ul>
          </Card>
        </div>
        <ProjectAlerts projectId={project.id} />
        <DecisionTimeline decisions={decisions.data?.items ?? null} loading={decisions.isPending} />
      </div>
      <div className="flex flex-col gap-6">
        <Card className="p-5">
          <h2 className="text-sm font-medium text-fg-secondary">Key decisions · confirmed, latest first</h2>
          {decisions.isPending ? <LoadingSkeleton rows={3} className="mt-3" /> : (
            <ul className="mt-3 flex flex-col gap-2">
              {key.map((d) => (
                <li key={d.id} className="flex items-baseline gap-2 text-base text-fg">
                  <span className="shrink-0 font-mono text-xs whitespace-nowrap text-fg-secondary">{d.decision?.code}</span>
                  {d.title ?? d.decision?.title}
                </li>
              ))}
            </ul>
          )}
        </Card>
        <Card className="p-5">
          <h2 className="text-sm font-medium text-fg-secondary">Pending actions · {pending.length}</h2>
          {pending.length ? (
            <ul className="mt-3 flex flex-col gap-3">
              {pending.map((p) => (
                <li key={p.id} className="rounded-card bg-elevated/60 p-3">
                  <Link to={`/approvals/${p.id}`} className="text-base text-fg hover:underline hover:underline-offset-4">
                    {p.title}
                  </Link>
                  <p className="mt-2 flex items-center gap-3">
                    <span className="font-mono text-xs text-fg-secondary">{p.target.repository}</span>
                    <StatusBadge status={p.risk_level} />
                  </p>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-3 text-sm text-fg-secondary">No actions wait for approval.</p>
          )}
          <Link to="/approvals" className="mt-3 inline-block text-sm text-accent underline underline-offset-4 hover:text-fg">
            Review in Approvals
          </Link>
        </Card>
        <Card className="p-5">
          <h2 className="text-sm font-medium text-fg-secondary">Related sources · {sources.data?.total ?? project.counts.sources}</h2>
          <ul className="mt-3 flex flex-col gap-2">
            {sources.data?.items.map((s) => (
              <li key={s.id}>
                <Link to={`/knowledge/sources/${s.id}`} className="text-base text-fg hover:underline hover:underline-offset-4">
                  {s.title}
                </Link>
              </li>
            ))}
          </ul>
          <Link to={`/projects/${project.id}/sources`} className="mt-3 inline-block text-sm text-accent underline underline-offset-4 hover:text-fg">
            All {sources.data?.total ?? project.counts.sources} sources
          </Link>
        </Card>
      </div>
    </div>
  );
}
