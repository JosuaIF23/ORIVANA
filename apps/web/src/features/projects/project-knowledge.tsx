import { useNavigate } from 'react-router';
import type { ProjectDetail } from '@contracts/types';
import { ButtonLink } from '@/components/ui/button';
import { Card } from '@/components/ui/primitives';
import { EmptyState, ErrorState, LoadingSkeleton } from '@/components/common/states';
import { ClaimCard } from '@/features/claims/claim-card';
import { useClaims } from '@/features/claims/use-claims';
import { DecisionAlertRow } from '@/features/decisions/decision-alert-card';
import { useDecisionAlerts } from '@/features/decisions/use-decisions';
import { MatrixGrid } from '@/features/matrix/matrix-grid';
import { useMatrix } from '@/features/matrix/use-matrix';

/** "Decisions needing review" for one project (UI.md §4.12 overview card). Hidden when there are none. */
export function ProjectAlerts({ projectId }: { projectId: string }) {
  const { data, isPending, error, refetch } = useDecisionAlerts({ status: 'open', project_id: projectId });
  if (isPending) return null;
  if (error) return <ErrorState title="Decision alerts didn’t load" error={error} onRetry={() => refetch()} />;
  if (!data.items.length) return null;
  return (
    <Card className="border-warning/50 p-5">
      <section aria-labelledby="project-alerts">
        <h2 id="project-alerts" className="text-sm font-medium text-warning">
          Decisions needing review · {data.items.length}
        </h2>
        <ul className="mt-3 flex flex-col gap-4">
          {data.items.map((a) => (
            <DecisionAlertRow key={a.id} alert={a} />
          ))}
        </ul>
      </section>
    </Card>
  );
}

/** Project tab: the Matrix for this project; cells open in Knowledge → Matrix. */
export function ProjectMatrix({ project }: { project: ProjectDetail }) {
  const navigate = useNavigate();
  const { data, isPending, error, refetch } = useMatrix({ project_id: project.id });
  if (isPending) return <LoadingSkeleton rows={5} label="Loading matrix…" />;
  if (error) return <ErrorState error={error} onRetry={() => refetch()} />;
  if (!data.methods.length) return <EmptyState title="No matrix for this project yet" description="Methods and datasets appear once papers in this project finish extraction." />;
  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-fg-secondary">
          {data.methods.length} methods × {data.datasets.length} datasets · <span className="text-fg">{data.gap_count} gaps</span> · confirmed relationships only
        </p>
        <ButtonLink to={`/knowledge/matrix?project=${project.id}`}>Open full Matrix</ButtonLink>
      </div>
      <div className="hidden md:block">
        <MatrixGrid data={data} methods={data.methods} datasets={data.datasets} projectName={project.name} selected={{ method: null, dataset: null }} onSelect={(m, d) => navigate(`/knowledge/matrix?project=${project.id}&cell=${encodeURIComponent(`${m}|${d}`)}`)} />
      </div>
      <p className="text-sm text-fg-secondary md:hidden">Open the full Matrix to see it as a list grouped by method.</p>
    </div>
  );
}

/** Project tab: claims, most contested first. */
export function ProjectClaims({ projectId }: { projectId: string }) {
  const navigate = useNavigate();
  const { data, isPending, error, refetch } = useClaims({ project_id: projectId, sort: 'most_contested' });
  if (isPending) return <LoadingSkeleton rows={4} label="Loading claims…" />;
  if (error) return <ErrorState error={error} onRetry={() => refetch()} />;
  if (!data.items.length) return <EmptyState title="No claims yet" description="Claims appear after extraction." />;
  return (
    <ul className="grid gap-3 lg:grid-cols-2">
      {data.items.map((c) => (
        <li key={c.id}>
          <ClaimCard claim={c} selected={false} onSelect={() => navigate(`/knowledge/claims?project=${projectId}&claim=${c.id}`)} />
        </li>
      ))}
    </ul>
  );
}
