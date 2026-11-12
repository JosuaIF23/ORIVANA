import { Link } from 'react-router';
import { Folder } from 'lucide-react';
import type { Project } from '@contracts/types';
import { formatAgo, plural } from '@/lib/format';
import { StatusBadge } from '@/components/common/status-badge';

/** Project summary card; the whole card is one link (UI.md §5 ProjectCard). */
export function ProjectCard({ project }: { project: Project }) {
  return (
    <Link to={`/projects/${project.id}`} className="group flex h-full flex-col rounded-card border border-subtle bg-surface p-6 transition-colors hover:border-control">
      <div className="flex items-start gap-3">
        <Folder aria-hidden="true" className="mt-1 size-5 shrink-0 text-accent" />
        <h3 className="min-w-0 flex-1 truncate text-lg font-semibold text-fg group-hover:underline group-hover:underline-offset-4">{project.name}</h3>
        <StatusBadge status={project.status} />
      </div>
      <p className="mt-3 text-base text-fg-secondary">{project.summary}</p>
      <p className="mt-auto pt-3 text-sm text-fg-muted">
        {plural(project.counts.sources, 'source')} · {plural(project.counts.decisions, 'decision')} · updated {formatAgo(project.updated_at)}
      </p>
    </Link>
  );
}
