import { useId } from 'react';
import { Download, Search } from 'lucide-react';
import type { Project } from '@contracts/types';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/controls';
import { Input, Select } from '@/components/ui/field';

const YEARS = [2023, 2024, 2025, 2026];

interface MatrixToolbarProps {
  projects: Project[];
  state: { project: string | null; candidates: boolean; from?: number; to?: number; q: string };
  set: (patch: Record<string, string | null>) => void;
  onExport: () => void;
  canExport: boolean;
}

/** Project, year range, Include candidates, search, Export CSV (UI.md §4.7). */
export function MatrixToolbar({ projects, state, set, onExport, canExport }: MatrixToolbarProps) {
  const id = useId();
  return (
    <div className="flex flex-wrap items-end gap-x-4 gap-y-3">
      <label className="flex flex-col gap-1 text-sm text-fg-secondary">
        Project
        <Select value={state.project ?? ''} onChange={(e) => set({ project: e.target.value || null, cell: null })} className="w-48">
          {projects.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </Select>
      </label>
      <fieldset className="flex items-end gap-2">
        <legend className="mb-1 text-sm text-fg-secondary">Published</legend>
        <Select aria-label="From year" value={state.from ?? ''} onChange={(e) => set({ from: e.target.value || null })} className="w-28">
          <option value="">Any year</option>
          {YEARS.map((y) => (
            <option key={y} value={y}>
              From {y}
            </option>
          ))}
        </Select>
        <Select aria-label="To year" value={state.to ?? ''} onChange={(e) => set({ to: e.target.value || null })} className="w-28">
          <option value="">Any year</option>
          {YEARS.map((y) => (
            <option key={y} value={y}>
              To {y}
            </option>
          ))}
        </Select>
      </fieldset>
      <div className="flex h-10 items-center gap-3">
        <Switch id={`${id}-cand`} checked={state.candidates} onCheckedChange={(v) => set({ candidates: v ? '1' : null })} />
        <label htmlFor={`${id}-cand`} className="text-sm text-fg">
          Include candidates
          <span className="sr-only">{state.candidates ? ' (on)' : ' (off)'}</span>
        </label>
      </div>
      <div className="relative min-w-48 flex-1 md:max-w-72">
        <Search aria-hidden="true" className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-fg-muted" />
        <Input type="search" name="matrix-search" autoComplete="off" aria-label="Search methods and datasets" placeholder="Search methods or datasets…" value={state.q} onChange={(e) => set({ q: e.target.value })} className="pl-9" />
      </div>
      <Button onClick={onExport} disabled={!canExport} className="ml-auto">
        <Download aria-hidden="true" />
        Export CSV
      </Button>
    </div>
  );
}
