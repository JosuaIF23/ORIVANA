import { Link } from 'react-router';
import { TriangleAlert } from 'lucide-react';
import type { Message } from '@contracts/types';
import { useDecisionAlerts } from '@/features/decisions/use-decisions';

/**
 * "This relates to a decision that needs review" (UI.md §4.5): shown when the
 * answer cites a paper that is evidence in an open Decision Impact alert.
 */
export function DecisionReviewNotice({ message }: { message: Message }) {
  const { data } = useDecisionAlerts({ status: 'open' });
  const cited = new Set(message.citations.map((c) => c.source_id));
  const alert = data?.items.find((a) => [...a.previous_evidence, ...a.new_evidence].some((e) => cited.has(e.source_id)));
  if (!alert) return null;
  return (
    <p className="flex flex-wrap items-center gap-2 rounded-card border border-warning/50 bg-warning/5 px-4 py-3 text-sm text-fg">
      <TriangleAlert aria-hidden="true" className="size-4 text-warning" />
      This relates to a decision that needs review:
      <Link to={`/decision-alerts/${alert.id}`} className="text-accent underline underline-offset-4 hover:text-fg">
        {alert.decision_code} {alert.decision_title}
      </Link>
    </p>
  );
}
