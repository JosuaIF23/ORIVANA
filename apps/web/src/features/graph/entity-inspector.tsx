import type { Entity, Relationship } from '@contracts/types';
import { RELATION_LABEL } from '@/lib/relations';
import { Button } from '@/components/ui/button';
import { EntityTypeIcon, ENTITY_TYPE } from '@/components/common/entity-icon';
import { StatusBadge } from '@/components/common/status-badge';
import { ButtonLink } from '@/components/ui/button';
import { InspectorHeader } from './relationship-inspector';

/** Selected node: type, aliases, its relationships (click one to inspect it). */
export function EntityInspector({ entity, edges, names, onSelect, onFocus, onClose }: { entity: Entity; edges: Relationship[]; names: Map<string, string>; onSelect: (id: string) => void; onFocus: () => void; onClose: () => void }) {
  const related = edges.filter((e) => e.from_entity_id === entity.id || e.to_entity_id === entity.id);
  return (
    <div className="flex h-full flex-col">
      <InspectorHeader title={ENTITY_TYPE[entity.entity_type].label} onClose={onClose} />
      <div className="min-h-0 flex-1 overflow-y-auto px-6 py-5">
        <p className="flex items-center gap-2 text-lg font-semibold text-fg">
          <EntityTypeIcon type={entity.entity_type} className="size-5" />
          <span className={entity.status === 'superseded' ? 'line-through' : undefined}>{entity.canonical_name}</span>
        </p>
        {entity.status === 'superseded' ? <StatusBadge status="superseded" className="mt-3" /> : null}
        {entity.aliases.length ? <p className="mt-2 text-sm text-fg-secondary">Also known as: {entity.aliases.join(', ')}</p> : null}
        <div className="mt-4 flex flex-wrap gap-2">
          <Button size="sm" onClick={onFocus}>
            Focus · 1 hop
          </Button>
          {entity.source_id ? (
            <ButtonLink to={`/knowledge/sources/${entity.source_id}`} size="sm" variant="ghost">
              Open source
            </ButtonLink>
          ) : null}
        </div>
        <h3 className="mt-6 text-sm font-medium text-fg-secondary">Relationships · {related.length}</h3>
        <ul className="mt-3 flex flex-col gap-2">
          {related.map((r) => {
            const outgoing = r.from_entity_id === entity.id;
            const other = names.get(outgoing ? r.to_entity_id : r.from_entity_id);
            return (
              <li key={r.id}>
                <button type="button" onClick={() => onSelect(r.id)} className="flex w-full items-center justify-between gap-3 rounded-control border border-subtle bg-surface px-3 py-2.5 text-left text-sm text-fg hover:border-control">
                  <span>
                    {outgoing ? `${RELATION_LABEL[r.relation_type]} → ${other}` : `${other} → ${RELATION_LABEL[r.relation_type].toLowerCase()}`}
                  </span>
                  <StatusBadge status={r.status} />
                </button>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}
