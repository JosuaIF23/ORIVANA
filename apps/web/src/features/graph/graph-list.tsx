import type { Entity, Relationship } from '@contracts/types';
import { cn } from '@/lib/cn';
import { formatConfidence } from '@/lib/format';
import { RELATION_LABEL } from '@/lib/relations';
import { Button } from '@/components/ui/button';
import { EntityTypeIcon } from '@/components/common/entity-icon';
import { StatusBadge } from '@/components/common/status-badge';

export const LIST_PAGE_SIZE = 12;

interface Props {
  edges: Relationship[];
  entities: Map<string, Entity>;
  selected: string | null;
  page: number;
  onSelect: (id: string) => void;
  onPage: (page: number) => void;
}

/** Textual alternative to the canvas: relationships table, candidates first (UI.md §4.6, §8). */
export function GraphList({ edges, entities, selected, page, onSelect, onPage }: Props) {
  const rows = edges.slice((page - 1) * LIST_PAGE_SIZE, page * LIST_PAGE_SIZE);
  const end = Math.min(page * LIST_PAGE_SIZE, edges.length);
  const node = (id: string) => {
    const e = entities.get(id);
    return e ? (
      <span className="flex items-center gap-2">
        <EntityTypeIcon type={e.entity_type} />
        <span className={e.status === 'superseded' ? 'line-through' : undefined}>{e.canonical_name}</span>
      </span>
    ) : (
      id
    );
  };
  return (
    <div className="flex h-full flex-col">
      <div className="min-h-0 flex-1 overflow-auto">
        <table className="w-full min-w-[720px] border-collapse text-left text-base">
          <thead className="sticky top-0 bg-app">
            <tr className="border-b border-subtle text-sm text-fg-secondary">
              <th scope="col" className="px-4 py-3 font-medium">From</th>
              <th scope="col" className="px-4 py-3 font-medium">Relationship</th>
              <th scope="col" className="px-4 py-3 font-medium">To</th>
              <th scope="col" className="px-4 py-3 font-medium">Status</th>
              <th scope="col" className="px-4 py-3 text-right font-medium">Evidence</th>
              <th scope="col" className="px-4 py-3 text-right font-medium">Conf.</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id} aria-selected={selected === r.id} className={cn('border-b border-subtle', selected === r.id ? 'bg-elevated' : 'hover:bg-surface')}>
                <td className="px-4 py-3 text-fg">
                  <button type="button" onClick={() => onSelect(r.id)} className="rounded-control text-left" aria-label={`Inspect: ${entities.get(r.from_entity_id)?.canonical_name} ${RELATION_LABEL[r.relation_type].toLowerCase()} ${entities.get(r.to_entity_id)?.canonical_name}`}>
                    {node(r.from_entity_id)}
                  </button>
                </td>
                <td className="px-4 py-3 text-fg-secondary">{RELATION_LABEL[r.relation_type]}</td>
                <td className="px-4 py-3 text-fg">{node(r.to_entity_id)}</td>
                <td className="px-4 py-3">
                  <StatusBadge status={r.status} />
                </td>
                <td className="px-4 py-3 text-right text-fg-secondary tabular">{r.evidence_count || '—'}</td>
                <td className="px-4 py-3 text-right text-fg-secondary tabular">{r.confidence === null ? 'User' : formatConfidence(r.confidence)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <nav aria-label="Pagination" className="flex items-center justify-between border-t border-subtle px-4 py-3">
        <p className="text-sm text-fg-secondary">
          Showing {edges.length ? (page - 1) * LIST_PAGE_SIZE + 1 : 0}–{end} of {edges.length}
        </p>
        <div className="flex gap-3">
          <Button variant="ghost" disabled={page === 1} onClick={() => onPage(page - 1)}>
            Previous
          </Button>
          <Button disabled={end >= edges.length} onClick={() => onPage(page + 1)}>
            Next
          </Button>
        </div>
      </nav>
    </div>
  );
}
