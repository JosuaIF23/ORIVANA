import type { EntityType, GraphResponse, RelationType } from '@contracts/types';
import { cn } from '@/lib/cn';
import { RELATION_LABEL, RELATION_TYPES } from '@/lib/relations';
import { useProjectsList } from '@/hooks/use-data';
import { Checkbox } from '@/components/ui/controls';
import { Field, Select } from '@/components/ui/field';
import { EntityTypeIcon, ENTITY_TYPE } from '@/components/common/entity-icon';
import { useSources } from '@/features/sources/use-sources';
import { ENTITY_TYPES, type GraphState } from './graph-state';

interface Props {
  state: GraphState;
  counts: GraphResponse['counts'] | undefined;
  set: (patch: Record<string, string | null>) => void;
  className?: string;
}

function CheckRow({ id, checked, onChange, icon, label, count }: { id: string; checked: boolean; onChange: (v: boolean) => void; icon?: React.ReactNode; label: string; count?: number }) {
  return (
    <li className="flex items-center gap-3">
      <Checkbox id={id} checked={checked} onCheckedChange={onChange} />
      <label htmlFor={id} className="flex flex-1 items-center gap-2 text-base text-fg">
        {icon}
        {label}
      </label>
      {count !== undefined ? <span className="text-sm text-fg-secondary tabular">{count}</span> : null}
    </li>
  );
}

function toggle<T extends string>(all: T[], current: T[], value: T, on: boolean): string | null {
  const next = on ? [...current, value] : current.filter((v) => v !== value);
  return next.length === all.length ? null : next.join(',') || 'none';
}

/** Left filter panel: entity or relationship types, status, project, source, date. */
export function GraphFilters({ state, counts, set, className }: Props) {
  const { data: projects = [] } = useProjectsList();
  const { data: sources } = useSources({ project_id: state.project || undefined, limit: 50 });
  return (
    <aside aria-label="Map filters" className={cn('flex flex-col gap-7 border-r border-subtle px-6 py-6', className)}>
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-fg">Filters</h2>
        <button type="button" onClick={() => set({ types: null, rel: null, candidates: null, confirmed: null, source: null, since: null, project: null })} className="rounded-control text-sm text-fg-secondary hover:text-fg">
          Reset
        </button>
      </div>
      {state.view === 'graph' ? (
        <fieldset>
          <legend className="text-sm font-medium text-fg-secondary">Entity type</legend>
          <ul className="mt-3 flex flex-col gap-3">
            {ENTITY_TYPES.map((t: EntityType) => (
              <CheckRow key={t} id={`type-${t}`} checked={state.types.includes(t)} onChange={(v) => set({ types: toggle(ENTITY_TYPES, state.types, t, v) })} icon={<EntityTypeIcon type={t} />} label={ENTITY_TYPE[t].label} count={counts?.by_type[t]} />
            ))}
          </ul>
        </fieldset>
      ) : (
        <fieldset>
          <legend className="text-sm font-medium text-fg-secondary">Relationship type</legend>
          <ul className="mt-3 flex flex-col gap-3">
            {RELATION_TYPES.map((r: RelationType) => (
              <CheckRow key={r} id={`rel-${r}`} checked={state.relations.includes(r)} onChange={(v) => set({ rel: toggle(RELATION_TYPES, state.relations, r, v), page: null })} label={RELATION_LABEL[r]} count={counts?.by_relation[r]} />
            ))}
          </ul>
        </fieldset>
      )}
      <fieldset>
        <legend className="text-sm font-medium text-fg-secondary">Relationship status</legend>
        <ul className="mt-3 flex flex-col gap-3">
          <CheckRow id="status-confirmed" checked={state.confirmed} onChange={(v) => set({ confirmed: v ? null : '0', page: null })} label="Confirmed" count={counts?.confirmed} />
          <CheckRow id="status-candidates" checked={state.candidates} onChange={(v) => set({ candidates: v ? '1' : null, page: null })} label="Show candidates" count={counts?.candidate} />
        </ul>
      </fieldset>
      <Field label="Project">
        {({ id }) => (
          <Select id={id} value={state.project} onChange={(e) => set({ project: e.target.value === 'prj_rag' ? null : e.target.value })}>
            {projects.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </Select>
        )}
      </Field>
      {state.view === 'graph' ? (
        <>
          <Field label="Source">
            {({ id }) => (
              <Select id={id} value={state.source ?? ''} onChange={(e) => set({ source: e.target.value || null })}>
                <option value="">All sources ({sources?.total ?? 0})</option>
                {sources?.items.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.short_label}
                  </option>
                ))}
              </Select>
            )}
          </Field>
          <Field label="Date added">
            {({ id }) => (
              <Select id={id} value={state.since ?? ''} onChange={(e) => set({ since: e.target.value || null })}>
                <option value="">Any time</option>
                <option value="7">Last 7 days</option>
                <option value="30">Last 30 days</option>
              </Select>
            )}
          </Field>
        </>
      ) : null}
    </aside>
  );
}
