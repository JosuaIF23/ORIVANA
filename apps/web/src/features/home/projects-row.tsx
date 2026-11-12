import { Link } from 'react-router';
import { useProjectsList } from '@/hooks/use-data';
import { Skeleton } from '@/components/ui/primitives';
import { ErrorState } from '@/components/common/states';
import { ProjectCard } from '@/features/projects/project-card';

export function ProjectsRow() {
  const { data: projects, isPending, error, refetch } = useProjectsList();
  return (
    <section aria-labelledby="recent-projects">
      <div className="flex items-baseline justify-between">
        <h2 id="recent-projects" className="text-lg font-semibold text-fg">
          Recent projects
        </h2>
        <Link to="/projects" className="rounded-control text-sm text-accent underline underline-offset-4 hover:text-fg">
          All projects
        </Link>
      </div>
      <div className="mt-4 grid gap-6 md:grid-cols-2">
        {isPending ? (
          <>
            <Skeleton className="h-36" />
            <Skeleton className="h-36" />
          </>
        ) : error ? (
          <ErrorState error={error} onRetry={() => refetch()} />
        ) : (
          projects.slice(0, 2).map((p) => <ProjectCard key={p.id} project={p} />)
        )}
      </div>
    </section>
  );
}
