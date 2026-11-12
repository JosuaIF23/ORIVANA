import { TriangleAlert } from 'lucide-react';
import type { DecisionAlert } from '@contracts/types';
import { formatRelativeDay } from '@/lib/format';
import { ButtonLink } from '@/components/ui/button';
import { StatusBadge } from '@/components/common/status-badge';

/** Compact Decision Impact alert for Home and Project (UI.md §5 DecisionAlertCard). */
export function DecisionAlertRow({ alert }: { alert: DecisionAlert }) {
  return (
    <li className="flex flex-col gap-3 border-l-4 border-l-warning py-1 pl-4 sm:flex-row sm:items-center">
      <div className="min-w-0 flex-1">
        <p className="flex flex-wrap items-center gap-2 text-base font-semibold text-fg">
          <TriangleAlert aria-hidden="true" className="size-4 shrink-0 text-warning" />
          {alert.decision_code ? <span className="font-mono text-sm text-fg-secondary">{alert.decision_code}</span> : null}
          {alert.decision_title}
        </p>
        <p className="mt-1 text-sm text-fg-secondary">
          Claim affected: <span className="text-fg">{alert.claim_statement}</span>
        </p>
        <p className="mt-1 text-sm text-fg-secondary">
          New paper: <span className="text-fg">{alert.trigger_source_label}</span> · {formatRelativeDay(alert.detected_at)}
        </p>
      </div>
      <div className="flex shrink-0 items-center gap-3">
        <StatusBadge status={alert.severity} />
        <ButtonLink to={`/decision-alerts/${alert.id}`} variant="primary" size="sm" aria-label={`Review ${alert.decision_title}`}>
          Review
        </ButtonLink>
      </div>
    </li>
  );
}
