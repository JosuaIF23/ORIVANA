import { useEffect, useState } from 'react';
import { LayoutGrid, List } from 'lucide-react';
import type { Project } from '@contracts/types';
import { cn } from '@/lib/cn';
import { Field, Input, Select } from '@/components/ui/field';

interface Props {
  params: URLSearchParams;
  projects: Project[];
  view: 'table' | 'list';
  onChange: (key: string, value: string | null) => void;
}

/** Search + project/status/type filters + Table/List toggle. */
export function SourceFilters({ params, projects, view, onChange }: Props) {
  const [q, setQ] = useState(params.get('q') ?? '');
  useEffect(() => {
    const id = window.setTimeout(() => {
      if ((params.get('q') ?? '') !== q) onChange('q', q || null);
    }, 250);
    return () => window.clearTimeout(id);
  }, [q, params, onChange]);

  return (
    <div className="grid gap-4 md:grid-cols-[minmax(0,2fr)_minmax(0,1fr)_minmax(0,1fr)_minmax(0,1fr)_auto] md:items-end">
      <Field label="Search">
        {({ id }) => <Input id={id} type="search" name="source-search" autoComplete="off" placeholder="Title, author, or text…" value={q} onChange={(e) => setQ(e.target.value)} />}
      </Field>
      <Field label="Project">
        {({ id }) => (
          <Select id={id} value={params.get('project') ?? ''} onChange={(e) => onChange('project', e.target.value || null)}>
            <option value="">All projects</option>
            {projects.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </Select>
        )}
      </Field>
      <Field label="Status">
        {({ id }) => (
          <Select id={id} value={params.get('status') ?? ''} onChange={(e) => onChange('status', e.target.value || null)}>
            <option value="">Any status</option>
            <option value="queued">Queued</option>
            <option value="parsing">Parsing</option>
            <option value="indexing">Indexing</option>
            <option value="ready">Ready</option>
            <option value="failed">Failed</option>
          </Select>
        )}
      </Field>
      <Field label="Type">
        {({ id }) => (
          <Select id={id} value={params.get('type') ?? ''} onChange={(e) => onChange('type', e.target.value || null)}>
            <option value="">Any type</option>
            <option value="pdf">PDF</option>
            <option value="markdown">Markdown</option>
            <option value="txt">TXT</option>
          </Select>
        )}
      </Field>
      <div role="group" aria-label="View" className="flex h-10 rounded-control border border-control p-0.5">
        {(['table', 'list'] as const).map((v) => (
          <button
            key={v}
            type="button"
            aria-pressed={view === v}
            onClick={() => onChange('view', v === 'table' ? null : 'list')}
            className={cn('flex items-center gap-2 rounded-badge px-3 text-sm', view === v ? 'bg-elevated text-fg' : 'text-fg-secondary hover:text-fg')}
          >
            {v === 'table' ? <List aria-hidden="true" className="size-4" /> : <LayoutGrid aria-hidden="true" className="size-4" />}
            {v === 'table' ? 'Table' : 'List'}
          </button>
        ))}
      </div>
    </div>
  );
}
