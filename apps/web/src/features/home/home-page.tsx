import { Plus } from 'lucide-react';
import { now } from '@/lib/clock';
import { formatLongDate, greeting } from '@/lib/format';
import { useMe } from '@/hooks/use-session';
import { ButtonLink } from '@/components/ui/button';
import { PageHeader } from '@/components/common/page-header';
import { AskCard } from './ask-card';
import { ProjectsRow } from './projects-row';
import { RecentSourcesCard } from './recent-sources-card';
import { PendingApprovalsCard } from './pending-approvals-card';
import { RecentActivityCard } from './recent-activity-card';
import { ConnectorHealthCard } from './connector-health-card';
import { HomeEmpty } from './home-empty';
import { DecisionsReviewCard } from './decisions-review-card';

/**
 * Home / Command Center (UI.md v2 §4.4). Order: ask, decisions needing review,
 * pending approvals, recent projects, recent sources, recent activity, connector health.
 */
export default function HomePage() {
  const { data: me } = useMe();
  if (!me) return null;
  const firstName = me.user.name?.split(' ')[0];
  if (me.counts.sources === 0) return <HomeEmpty firstName={firstName ?? null} />;

  return (
    <div className="mx-auto flex max-w-[1180px] flex-col gap-8">
      <PageHeader
        title={`${greeting(now())}${firstName ? `, ${firstName}` : ''}`}
        description={`${formatLongDate(now())} · ${me.workspace.name}`}
        actions={
          <ButtonLink to="/knowledge/sources?upload=1" size="lg">
            <Plus aria-hidden="true" />
            Add a source
          </ButtonLink>
        }
      />
      <AskCard />
      <DecisionsReviewCard />
      <PendingApprovalsCard />
      <ProjectsRow />
      <div className="grid items-start gap-6 lg:grid-cols-2">
        <RecentSourcesCard />
        <div className="flex flex-col gap-6">
          <RecentActivityCard />
          <ConnectorHealthCard />
        </div>
      </div>
    </div>
  );
}
