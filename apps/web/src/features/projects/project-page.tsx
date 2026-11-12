import { useState } from 'react';
import { Link, useParams } from 'react-router';
import { cn } from '@/lib/cn';
import { useProject } from '@/hooks/use-data';
import { Button, ButtonLink } from '@/components/ui/button';
import { StatusBadge } from '@/components/common/status-badge';
import { ErrorState, LoadingSkeleton } from '@/components/common/states';
import { ProjectOverview } from './project-overview';
import { ProjectTabContent } from './project-tabs';
import { EditProjectDialog } from './edit-project-dialog';

const TABS = [
  { key: 'overview', label: 'Overview' },
  { key: 'sources', label: 'Sources' },
  { key: 'graph', label: 'Graph' },
  { key: 'memories', label: 'Memories & decisions' },
  { key: 'conversations', label: 'Conversations' },
  { key: 'actions', label: 'Actions' },
  { key: 'timeline', label: 'Timeline' },
] as const;

/** Project workspace (UI.md §4.9). Tabs are routes: /projects/:id/:tab. */
export default function ProjectPage() {
  const { projectId = '', tab = 'overview' } = useParams();
  const { data: project, isPending, error, refetch } = useProject(projectId);
  const [editing, setEditing] = useState(false);
  if (isPending) return <LoadingSkeleton rows={6} label="Loading project…" />;
  if (error) return <ErrorState error={error} title="Project not available" onRetry={() => refetch()} />;

  const counts: Record<string, string | null> = {
    sources: String(project.counts.sources),
    conversations: String(project.counts.conversations),
    actions: project.counts.pending_actions ? `${project.counts.pending_actions} pending` : null,
  };

  return (
    <div className="mx-auto flex max-w-[1240px] flex-col gap-6">
      <nav aria-label="Breadcrumb">
        <ol className="flex gap-2 text-base">
          <li><Link to="/projects" className="text-fg-secondary underline underline-offset-4 hover:text-fg">Projects</Link></li>
          <li aria-hidden="true" className="text-fg-muted">/</li>
          <li aria-current="page" className="text-fg">{project.name}</li>
        </ol>
      </nav>
      <header className="flex flex-wrap items-start gap-4">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-2xl font-semibold text-fg">{project.name}</h1>
            <StatusBadge status={project.status} size="md" />
          </div>
          <p className="mt-2 max-w-3xl text-base text-fg-secondary">{project.description}</p>
        </div>
        <Button variant="ghost" size="lg" onClick={() => setEditing(true)}>
          Edit project
        </Button>
        <ButtonLink to={`/assistant/new?project=${project.id}`} variant="primary" size="lg">
          Ask about this project
        </ButtonLink>
      </header>
      <nav aria-label="Project sections" className="-mx-4 overflow-x-auto overflow-y-hidden border-b border-subtle px-4">
        <ul className="flex gap-6">
          {TABS.map((t) => (
            <li key={t.key} className="shrink-0">
              <Link
                to={t.key === 'overview' ? `/projects/${project.id}` : `/projects/${project.id}/${t.key}`}
                aria-current={tab === t.key ? 'page' : undefined}
                className={cn('-mb-px inline-flex items-baseline gap-2 border-b-2 pb-3 text-base', tab === t.key ? 'border-accent font-medium text-fg' : 'border-transparent text-fg-secondary hover:text-fg')}
              >
                {t.label}
                {counts[t.key] ? <span className="text-sm text-fg-muted tabular">{counts[t.key]}</span> : null}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
      {tab === 'overview' ? <ProjectOverview project={project} /> : <ProjectTabContent tab={tab} project={project} />}
      <EditProjectDialog project={project} open={editing} onOpenChange={setEditing} />
    </div>
  );
}
