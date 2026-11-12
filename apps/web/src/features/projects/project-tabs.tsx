import { Link } from 'react-router';
import type { ProjectDetail } from '@contracts/types';
import { formatListDate } from '@/lib/format';
import { useAuditEvents, useConversations, useProposals } from '@/hooks/use-data';
import { ButtonLink } from '@/components/ui/button';
import { Card } from '@/components/ui/primitives';
import { AuditSummary } from '@/components/common/audit-summary';
import { StatusBadge } from '@/components/common/status-badge';
import { EmptyState, LoadingSkeleton } from '@/components/common/states';
import { SourceTable } from '@/features/sources/source-table';
import { useSources } from '@/features/sources/use-sources';
import { MemoryTable } from '@/features/memory/memory-table';
import { useMemories } from '@/features/memory/use-memory';
import { DecisionTimeline } from './decision-timeline';

/** Content of the non-overview project tabs, each scoped to the project. */
export function ProjectTabContent({ tab, project }: { tab: string; project: ProjectDetail }) {
  switch (tab) {
    case 'sources':
      return <ProjectSources projectId={project.id} />;
    case 'graph':
      return (
        <Card className="flex flex-wrap items-center justify-between gap-4 p-6">
          <p className="text-base text-fg-secondary">Explore the papers, methods, datasets, and decisions in {project.name}, with candidate relationships to review.</p>
          <div className="flex gap-3">
            <ButtonLink to={`/knowledge/graph?project=${project.id}&candidates=1`} variant="primary">Open graph</ButtonLink>
            <ButtonLink to={`/knowledge/graph?project=${project.id}&view=list&candidates=1`}>List view</ButtonLink>
          </div>
        </Card>
      );
    case 'memories':
      return <ProjectMemories projectId={project.id} />;
    case 'conversations':
      return <ProjectConversations projectId={project.id} />;
    case 'actions':
      return <ProjectActions projectId={project.id} />;
    case 'timeline':
      return <ProjectTimeline projectId={project.id} />;
    default:
      return <EmptyState title="Unknown section" />;
  }
}

function ProjectSources({ projectId }: { projectId: string }) {
  const { data, isPending } = useSources({ project_id: projectId, limit: 50 });
  if (isPending) return <LoadingSkeleton rows={6} label="Loading sources…" />;
  return data?.items.length ? <SourceTable sources={data.items} highlight={null} /> : <EmptyState title="No sources in this project" action={<ButtonLink to="/knowledge/sources?upload=1">Add a source</ButtonLink>} />;
}

function ProjectMemories({ projectId }: { projectId: string }) {
  const memories = useMemories({ project_id: projectId, status: 'needs_review' });
  const decisions = useMemories({ project_id: projectId, decisions_only: true });
  return (
    <div className="flex flex-col gap-8">
      <DecisionTimeline decisions={decisions.data?.items ?? null} loading={decisions.isPending} />
      <section aria-label="Memories">
        <h2 className="mb-4 text-lg font-semibold text-fg">Memories</h2>
        {memories.isPending ? <LoadingSkeleton rows={4} /> : memories.data?.items.length ? <MemoryTable items={memories.data.items} grouped /> : <EmptyState title="No memories for this project yet" />}
      </section>
    </div>
  );
}

function ProjectConversations({ projectId }: { projectId: string }) {
  const { data, isPending } = useConversations(projectId);
  if (isPending) return <LoadingSkeleton rows={4} />;
  if (!data?.length) return <EmptyState title="No conversations yet" action={<ButtonLink to={`/assistant/new?project=${projectId}`} variant="primary">Ask about this project</ButtonLink>} />;
  return (
    <ul className="divide-y divide-subtle rounded-card border border-subtle">
      {data.map((c) => (
        <li key={c.id}>
          <Link to={`/assistant/${c.id}`} className="flex items-center justify-between gap-4 px-5 py-4 hover:bg-surface">
            <span className="text-base text-fg">{c.title}</span>
            <span className="text-sm text-fg-secondary">{formatListDate(c.last_message_at)}</span>
          </Link>
        </li>
      ))}
    </ul>
  );
}

function ProjectActions({ projectId }: { projectId: string }) {
  const pending = useProposals('pending');
  const decided = useProposals('decided');
  const items = [...(pending.data?.items ?? []), ...(decided.data?.items ?? [])].filter((p) => p.project_id === projectId);
  if (pending.isPending || decided.isPending) return <LoadingSkeleton rows={4} />;
  if (!items.length) return <EmptyState title="No actions yet" description="Actions proposed in conversations appear here and in Approvals." />;
  return (
    <ul className="divide-y divide-subtle rounded-card border border-subtle">
      {items.map((p) => (
        <li key={p.id}>
          <Link to={`/approvals/${p.id}`} className="flex flex-wrap items-center gap-4 px-5 py-4 hover:bg-surface">
            <span className="min-w-0 flex-1 text-base text-fg">{p.title}</span>
            <span className="font-mono text-xs text-fg-secondary">{p.latest_run?.external_ref ?? p.target.repository}</span>
            <StatusBadge status={p.status} />
          </Link>
        </li>
      ))}
    </ul>
  );
}

function ProjectTimeline({ projectId }: { projectId: string }) {
  const { data, isPending } = useAuditEvents({ since_days: 30, limit: 30 });
  if (isPending) return <LoadingSkeleton rows={6} />;
  const events = (data?.items ?? []).filter((e) => e.metadata.related?.project_name || e.link?.target_type !== 'project' || e.target_id === projectId);
  return (
    <ol className="divide-y divide-subtle rounded-card border border-subtle">
      {events.map((e) => (
        <li key={e.id} className="flex gap-6 px-5 py-3 text-base">
          <time dateTime={e.created_at} className="w-16 shrink-0 text-sm text-fg-muted">{formatListDate(e.created_at)}</time>
          <p className="min-w-0 text-fg"><AuditSummary event={e} /></p>
        </li>
      ))}
    </ol>
  );
}
