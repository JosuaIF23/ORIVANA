import { Link } from 'react-router';
import { Check, Cpu, TriangleAlert, X } from 'lucide-react';
import type { AlertEvidence, DecisionAlert } from '@contracts/types';
import { formatConfidence, formatDate } from '@/lib/format';
import { EvidenceCompare, type CompareItem } from '@/components/common/evidence-compare';

function toItems(list: AlertEvidence[], isNew: boolean): CompareItem[] {
  return list.map((e) => ({
    key: `${e.source_id}-${e.passage.chunk_id}`,
    source_id: e.source_id,
    source_label: e.source_label,
    source_title: e.source_title,
    chunk_id: e.passage.chunk_id,
    page: e.passage.page,
    section: e.passage.section,
    passage: e.passage.passage,
    char_start: e.passage.char_start,
    char_end: e.passage.char_end,
    imported_at: e.imported_at,
    isNew,
  }));
}

/** The three-part body of the Decision Impact review (UI.md §4.11): decision · claim · old vs new evidence, plus the system assessment. */
export function DecisionImpactView({ alert }: { alert: DecisionAlert }) {
  const back = { href: `/decision-alerts/${alert.id}`, label: `the review of ${alert.decision_code ?? 'this decision'}` };
  return (
    <div className="flex flex-col gap-6">
      <div className="grid gap-4 lg:grid-cols-2">
        <section aria-labelledby="impact-decision" className="rounded-card border border-subtle bg-surface p-5">
          <h2 id="impact-decision" className="text-sm font-medium text-fg-secondary">
            Decision
          </h2>
          <p className="mt-2 text-base font-semibold text-fg">{alert.decision_statement}</p>
          <p className="mt-2 text-sm text-fg-secondary">
            <span className="text-fg">Rationale:</span> {alert.decision_rationale ?? 'No rationale recorded.'}
          </p>
          <p className="mt-2 text-sm text-fg-secondary">
            {alert.decided_at ? `Decided ${formatDate(alert.decided_at)}` : 'Not decided yet'} ·{' '}
            <Link to={`/knowledge/memory?decision=${alert.memory_id}`} className="text-accent underline underline-offset-4 hover:text-fg">
              Open decision
            </Link>
          </p>
        </section>
        <section aria-labelledby="impact-claim" className="rounded-card border border-subtle bg-surface p-5">
          <h2 id="impact-claim" className="text-sm font-medium text-fg-secondary">
            Claim affected
          </h2>
          <p className="mt-2 text-base font-semibold text-fg">{alert.claim_statement}</p>
          <p className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-sm">
            <span className="inline-flex items-center gap-1 text-knowledge">
              <Check aria-hidden="true" className="size-4" />
              Supported by {alert.previous_support.supports_count} papers before
            </span>
            <span className="inline-flex items-center gap-1 text-danger">
              <X aria-hidden="true" className="size-4" />
              {alert.new_evidence.length} new contradiction
            </span>
          </p>
          <Link to={`/knowledge/claims?claim=${alert.claim_id}`} className="mt-2 inline-block text-sm text-accent underline underline-offset-4 hover:text-fg">
            Open in Claims
          </Link>
        </section>
      </div>
      <section aria-labelledby="impact-evidence">
        <h2 id="impact-evidence" className="mb-3 text-lg font-semibold text-fg">
          Evidence comparison
        </h2>
        <EvidenceCompare
          back={back}
          left={{ title: 'Supported by', icon: <Check />, tone: 'knowledge', items: toItems(alert.previous_evidence, false), empty: 'No earlier supporting evidence.' }}
          right={{ title: 'New contradicting evidence', icon: <X />, tone: 'danger', items: toItems(alert.new_evidence, true), empty: 'The contradicting source was deleted.' }}
        />
      </section>
      <section aria-labelledby="impact-assessment" className="rounded-card border border-dashed border-control p-5">
        <h2 id="impact-assessment" className="flex flex-wrap items-center gap-2 text-sm font-medium text-fg">
          <Cpu aria-hidden="true" className="size-4 text-fg-secondary" />
          System assessment
          <span className="font-normal text-fg-secondary">· model-generated, check the passages above</span>
        </h2>
        <p className="mt-2 text-base text-fg-secondary">{alert.reason}</p>
        <p className="mt-2 flex items-center gap-2 text-sm text-fg-secondary">
          <TriangleAlert aria-hidden="true" className="size-4 text-warning" />
          {alert.severity === 'weakens' ? 'May weaken the decision' : 'Effect is uncertain'} · confidence {formatConfidence(alert.confidence)}
        </p>
      </section>
    </div>
  );
}
