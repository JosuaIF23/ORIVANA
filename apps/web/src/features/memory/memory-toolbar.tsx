import { useEffect, useState } from 'react';
import type { MemoryStatus, Project } from '@contracts/types';
import { cn } from '@/lib/cn';
import { Input, Select } from '@/components/ui/field';
import type { MemoryTab } from './memory-page';

const TABS: Array<{ key: MemoryTab; label: string; count: (c: Record<MemoryStatus, number>) => number }> = [
  { key: 'needs_review', label: 'Needs review', count: (c) => c.candidate },
  { key: 'confirmed', label: 'Confirmed', count: (c) => c.confirmed },
  { key: 'superseded', label: 'Superseded', count: (c) => c.superseded },
  { key: 'rejected', label: 'Rejected', count: (c) => c.rejected },
  { key: 'all', label: 'All', count: (c) => c.candidate + c.confirmed + c.superseded + c.rejected },
];

interface Props {
  tab: MemoryTab;
  counts: Record<MemoryStatus, number> | undefined;
  params: URLSearchParams;
  projects: Project[];
  onChange: (key: string, value: string | null) => void;
}

/** Status tabs with counts, type and project filters, search. */
export function MemoryToolbar({ tab, counts, params, projects, onChange }: Props) {
  const [q, setQ] = useState(params.get('q') ?? '');
  useEffect(() => {
    const id = window.setTimeout(() => {
      if ((params.get('q') ?? '') !== q) onChange('q', q || null);
    }, 250);
    return () => window.clearTimeout(id);
  }, [q, params, onChange]);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-4">
        <div role="group" aria-label="Memory status" className="flex flex-wrap rounded-control border border-control p-0.5">
          {TABS.map((t) => (
            <button
              key={t.key}
              type="button"
              aria-pressed={tab === t.key}
              onClick={() => onChange('status', t.key === 'needs_review' ? null : t.key)}
              className={cn('flex h-9 items-center gap-2 rounded-badge px-3 text-sm', tab === t.key ? 'bg-elevated font-medium text-fg' : 'text-fg-secondary hover:text-fg')}
            >
              {t.label}
              {counts ? (
                <span className={cn('rounded-full px-1.5 text-xs tabular', t.key === 'needs_review' && counts.candidate ? 'bg-warning/20 text-warning' : 'text-fg-muted')}>{t.count(counts)}</span>
              ) : null}
            </button>
          ))}
        </div>
        <label className="flex items-center gap-2 text-sm text-fg-secondary">
          Type
          <Select className="w-40" value={params.get('type') ?? ''} onChange={(e) => onChange('type', e.target.value || null)}>
            <option value="">All types</option>
            <option value="episodic">Episodic</option>
            <option value="semantic">Semantic</option>
            <option value="procedural">Procedural</option>
            <option value="project">Project</option>
          </Select>
        </label>
        <label className="flex items-center gap-2 text-sm text-fg-secondary">
          Project
          <Select className="w-48" value={params.get('project') ?? ''} onChange={(e) => onChange('project', e.target.value || null)}>
            <option value="">All projects</option>
            {projects.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </Select>
        </label>
      </div>
      <label htmlFor="memory-search" className="sr-only">
        Search memories
      </label>
      <Input id="memory-search" type="search" name="memory-search" autoComplete="off" placeholder="Search memories…" value={q} onChange={(e) => setQ(e.target.value)} />
    </div>
  );
}
