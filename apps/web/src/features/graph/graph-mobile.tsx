import type { Entity, Relationship } from '@contracts/types';
import { plural, formatConfidence } from '@/lib/format';
import { relationVerb } from '@/lib/relations';
import { StatusBadge } from '@/components/common/status-badge';

/** Phones get the relationship list, never a dense canvas (UI.md §7). */
export function GraphMobile({ edges, entities, projectName, onSelect }: { edges: Relationship[]; entities: Map<string, Entity>; projectName: string; onSelect: (id: string) => void }) {
  const toReview = edges.filter((e) => e.status === 'candidate').length;
  return (
    <div className="px-4 py-5">
      <p className="text-base text-fg-secondary">On phones the graph opens as a relationship list. The interactive canvas is available on tablet and desktop.</p>
      <h2 className="mt-5 text-base font-semibold text-fg">
        {projectName} · {toReview} to review
      </h2>
      <ul className="mt-4 flex flex-col gap-3">
        {edges.slice(0, 20).map((r) => (
          <li key={r.id}>
            <button type="button" onClick={() => onSelect(r.id)} className="w-full rounded-card border border-subtle bg-surface p-4 text-left">
              <span className="block text-lg font-semibold text-fg">
                {entities.get(r.from_entity_id)?.canonical_name} <span className="font-normal text-accent">{relationVerb(r.relation_type)}</span> {entities.get(r.to_entity_id)?.canonical_name}
              </span>
              <span className="mt-2 flex items-center gap-3 text-base text-fg-secondary">
                <StatusBadge status={r.status} />
                {plural(r.evidence_count, 'passage')} · {r.confidence === null ? 'set by you' : formatConfidence(r.confidence)}
              </span>
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
