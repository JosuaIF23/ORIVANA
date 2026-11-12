import { useState } from 'react';
import type { Memory, MemoryStatus, Project } from '@contracts/types';
import { cn } from '@/lib/cn';
import { Input, Select } from '@/components/ui/field';
import { EmptyState, ErrorState, LoadingSkeleton } from '@/components/common/states';
import { DeleteMemoryDialog, MemoryFormDialog, SupersedeDialog } from '@/features/memory/memory-dialogs';
import { useMemories } from '@/features/memory/use-memory';
import { DecisionRow } from './decision-row';

export type DecisionFilter = 'review' | 'proposed' | 'confirmed' | 'superseded' | 'rejected' | 'all';

const FILTERS: Array<[DecisionFilter, string]> = [
  ['review', 'Needs review first'],
  ['proposed', 'Proposed'],
  ['confirmed', 'Confirmed'],
  ['superseded', 'Superseded'],
  ['rejected', 'Rejected'],
  ['all', 'All'],
];

/** Default order (UI.md §4.10): Needs review → Proposed → Confirmed. */
function groupsFor(items: Memory[], filter: DecisionFilter): Array<[string, Memory[]]> {
  const needs = items.filter((d) => d.review_state === 'needs_review' && d.status !== 'superseded');
  const rest = items.filter((d) => !needs.includes(d));
  const by = (s: MemoryStatus[]) => rest.filter((d) => s.includes(d.status));
  if (filter === 'review') return [['Needs review', needs], ['Proposed', by(['proposed', 'candidate'])], ['Confirmed', by(['confirmed'])]];
  if (filter === 'all') return [['Needs review', needs], ['Proposed', by(['proposed', 'candidate'])], ['Confirmed', by(['confirmed'])], ['Superseded', by(['superseded'])], ['Rejected', by(['rejected'])]];
  return [[FILTERS.find(([k]) => k === filter)![1], items]];
}

type Dialogs = { kind: 'edit' | 'supersede' | 'delete'; memory: Memory } | null;

interface Props {
  filter: DecisionFilter;
  projectId: string | undefined;
  q: string;
  projects: Project[];
  onChange: (key: string, value: string | null) => void;
  onOpen: (id: string) => void;
}

/** Knowledge → Memory, primary view: decisions with review state (UI.md §4.10). */
export function DecisionsView({ filter, projectId, q, projects, onChange, onOpen }: Props) {
  const status = filter === 'review' || filter === 'all' ? undefined : filter;
  const { data, isPending, error, refetch } = useMemories({ decisions_only: true, project_id: projectId, q: q || undefined, status });
  const [dialog, setDialog] = useState<Dialogs>(null);
  const close = (open: boolean) => !open && setDialog(null);
  const items = data?.items.filter((d) => filter !== 'review' || d.status !== 'superseded' && d.status !== 'rejected') ?? [];
  const groups = groupsFor(items, filter).filter(([, list]) => list.length);

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-center gap-3">
        <div role="group" aria-label="Decision status" className="flex flex-wrap rounded-control border border-control p-0.5">
          {FILTERS.map(([key, label]) => (
            <button key={key} type="button" aria-pressed={filter === key} onClick={() => onChange('dstatus', key === 'review' ? null : key)} className={cn('flex h-9 items-center rounded-badge px-3 text-sm', filter === key ? 'bg-elevated font-medium text-fg' : 'text-fg-secondary hover:text-fg')}>
              {label}
            </button>
          ))}
        </div>
        <Select aria-label="Project" className="w-48" value={projectId ?? ''} onChange={(e) => onChange('project', e.target.value || null)}>
          <option value="">All projects</option>
          {projects.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </Select>
        <Input type="search" aria-label="Search decisions" autoComplete="off" placeholder="Search decisions…" value={q} onChange={(e) => onChange('q', e.target.value || null)} className="max-w-72 flex-1" />
      </div>
      {isPending ? (
        <LoadingSkeleton rows={5} label="Loading decisions…" />
      ) : error ? (
        <ErrorState error={error} onRetry={() => refetch()} />
      ) : groups.length === 0 ? (
        <EmptyState title={q ? 'No decisions match' : 'No decisions yet'} description={q ? 'Try another search or filter.' : 'Record a decision from an answer with “Save as decision”, or add one yourself.'} />
      ) : (
        groups.map(([label, list]) => (
          <section key={label} aria-label={`${label} · ${list.length}`}>
            <h3 className={cn('mb-3 text-sm font-medium', label === 'Needs review' ? 'text-warning' : 'text-fg-secondary')}>
              {label} · {list.length}
            </h3>
            <ul className="flex flex-col gap-3">
              {list.map((d) => (
                <DecisionRow
                  key={d.id}
                  decision={d}
                  replacement={data.items.find((x) => x.id === d.superseded_by_id)}
                  onOpen={() => onOpen(d.id)}
                  onEdit={() => setDialog({ kind: 'edit', memory: d })}
                  onSupersede={() => setDialog({ kind: 'supersede', memory: d })}
                  onDelete={() => setDialog({ kind: 'delete', memory: d })}
                />
              ))}
            </ul>
          </section>
        ))
      )}
      {dialog?.kind === 'edit' ? <MemoryFormDialog memory={dialog.memory} open onOpenChange={close} /> : null}
      {dialog?.kind === 'supersede' ? <SupersedeDialog memory={dialog.memory} open onOpenChange={close} /> : null}
      {dialog?.kind === 'delete' ? <DeleteMemoryDialog memory={dialog.memory} open onOpenChange={close} /> : null}
    </div>
  );
}
