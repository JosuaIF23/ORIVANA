import { Card } from '@/components/ui/primitives';
import { ErrorState, LoadingSkeleton } from '@/components/common/states';
import { DecisionAlertRow } from '@/features/decisions/decision-alert-card';
import { useDecisionAlerts } from '@/features/decisions/use-decisions';

/** Home card 2 (UI.md §4.4): shown only when at least one decision needs review. */
export function DecisionsReviewCard() {
  const { data, isPending, error, refetch } = useDecisionAlerts({ status: 'open' });
  if (isPending) return <LoadingSkeleton rows={2} label="Checking decisions…" />;
  if (error) return <ErrorState title="Decisions needing review didn’t load" error={error} onRetry={() => refetch()} />;
  if (!data.items.length) return null;
  const n = data.items.length;
  return (
    <Card className="border-warning/50 p-6">
      <section aria-labelledby="decisions-review">
        <h2 id="decisions-review" className="text-lg font-semibold text-fg">
          Decisions needing review
          <span className="ml-3 text-base font-normal text-warning">
            {n} decision{n === 1 ? ' needs' : 's need'} review
          </span>
        </h2>
        <p className="mt-1 text-sm text-fg-secondary">New evidence in your collection contradicts a claim these decisions depend on.</p>
        <ul className="mt-4 flex flex-col gap-4">
          {data.items.map((a) => (
            <DecisionAlertRow key={a.id} alert={a} />
          ))}
        </ul>
      </section>
    </Card>
  );
}
