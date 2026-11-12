import { useRef, useState, type KeyboardEvent } from 'react';
import type { MatrixAxisItem, MatrixCell as Cell, MatrixResponse } from '@contracts/types';
import { cn } from '@/lib/cn';

interface MatrixGridProps {
  data: MatrixResponse;
  methods: MatrixAxisItem[];
  datasets: MatrixAxisItem[];
  projectName: string;
  selected: { method: string | null; dataset: string | null };
  onSelect: (methodId: string, datasetId: string) => void;
}

/**
 * Methods × Datasets as a real table (UI.md §4.7, §8). Each cell is a button;
 * one roving tab stop, arrow keys move between cells, Home/End jump within a row.
 */
export function MatrixGrid({ data, methods, datasets, projectName, selected, onSelect }: MatrixGridProps) {
  const [active, setActive] = useState<[number, number]>([0, 0]);
  const refs = useRef(new Map<string, HTMLButtonElement>());
  const cellAt = (m: string, d: string) => data.cells.find((c) => c.method_id === m && c.dataset_id === d);
  const selRow = methods.findIndex((m) => m.id === selected.method);
  const selCol = datasets.findIndex((d) => d.id === selected.dataset);
  const [row, col] = selRow >= 0 && selCol >= 0 ? [selRow, selCol] : active;

  function move(e: KeyboardEvent, r: number, c: number) {
    const next: Record<string, [number, number]> = {
      ArrowRight: [r, Math.min(c + 1, datasets.length - 1)],
      ArrowLeft: [r, Math.max(c - 1, 0)],
      ArrowDown: [Math.min(r + 1, methods.length - 1), c],
      ArrowUp: [Math.max(r - 1, 0), c],
      Home: [r, 0],
      End: [r, datasets.length - 1],
    };
    const target = next[e.key];
    if (!target) return;
    e.preventDefault();
    setActive(target);
    refs.current.get(`${target[0]}:${target[1]}`)?.focus();
  }

  return (
    <div className="min-w-0 overflow-x-auto rounded-card border border-subtle">
      <table className="w-full min-w-[640px] border-collapse text-left">
        <caption className="sr-only">
          Methods by datasets in {projectName}. Use the arrow keys to move between cells; Enter opens the evidence.
        </caption>
        <thead>
          <tr className="border-b border-subtle bg-sidebar">
            <th scope="col" className="sticky left-0 z-10 w-48 bg-sidebar px-4 py-3 text-sm font-medium text-fg-secondary">
              Method <span aria-hidden="true">↓</span> · Dataset <span aria-hidden="true">→</span>
            </th>
            {datasets.map((d) => (
              <th key={d.id} scope="col" className="px-3 py-3 text-sm font-semibold text-fg">
                {d.name}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {methods.map((m, r) => (
            <tr key={m.id} className="border-b border-subtle last:border-b-0">
              <th scope="row" className="sticky left-0 z-10 bg-app px-4 py-2 text-base font-semibold text-fg">
                {m.name}
              </th>
              {datasets.map((d, c) => (
                <td key={d.id} className="p-1.5 align-top">
                  <MatrixCellButton
                    ref={(el) => {
                      if (el) refs.current.set(`${r}:${c}`, el);
                      else refs.current.delete(`${r}:${c}`);
                    }}
                    cell={cellAt(m.id, d.id)}
                    method={m}
                    dataset={d}
                    selected={m.id === selected.method && d.id === selected.dataset}
                    tabStop={r === row && c === col}
                    onSelect={() => {
                      setActive([r, c]);
                      onSelect(m.id, d.id);
                    }}
                    onKeyDown={(e) => move(e, r, c)}
                  />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

interface CellProps {
  ref: (el: HTMLButtonElement | null) => void;
  cell: Cell | undefined;
  method: MatrixAxisItem;
  dataset: MatrixAxisItem;
  selected: boolean;
  tabStop: boolean;
  onSelect: () => void;
  onKeyDown: (e: KeyboardEvent) => void;
}

/** Filled (count + citations), candidate (dashed + "Candidate"), or gap (dashed "—" + "No evidence"). */
function MatrixCellButton({ ref, cell, method, dataset, selected, tabStop, onSelect, onKeyDown }: CellProps) {
  const count = cell?.paper_ordinals.length ?? 0;
  const candidate = cell?.status === 'candidate';
  const label = cell
    ? `${method.name} on ${dataset.name}: ${count} paper${count === 1 ? '' : 's'}${candidate ? ', candidate' : ''}`
    : `${method.name} on ${dataset.name}: no evidence`;
  return (
    <button
      ref={ref}
      type="button"
      tabIndex={tabStop ? 0 : -1}
      aria-label={label}
      aria-pressed={selected}
      onClick={onSelect}
      onKeyDown={onKeyDown}
      className={cn(
        'group relative flex min-h-[76px] w-full flex-col items-start justify-center gap-1.5 rounded-control border px-3 py-2 text-left transition-colors',
        !cell && 'border-dashed border-subtle bg-transparent hover:border-control',
        cell && !candidate && 'border-subtle bg-surface hover:border-control',
        candidate && 'border-dashed border-warning/70 bg-warning/5 hover:border-warning',
        selected && 'border-solid border-accent ring-2 ring-accent ring-offset-2 ring-offset-app',
      )}
    >
      {cell ? (
        <>
          <span className="flex items-baseline gap-2">
            <span className="text-lg font-semibold text-fg tabular">{count}</span>
            <span aria-hidden="true" className="flex gap-1">
              {cell.paper_ordinals.map((n) => (
                <span key={n} className="inline-flex h-5 min-w-5 items-center justify-center rounded-badge border border-accent/50 bg-accent/10 px-1 text-xs font-semibold text-accent tabular">
                  {n}
                </span>
              ))}
            </span>
          </span>
          {candidate ? <span className="text-xs font-medium text-warning">Candidate</span> : cell.metric ? <span className="text-xs text-knowledge">{cell.metric}</span> : null}
        </>
      ) : (
        <>
          <span aria-hidden="true" className="text-lg text-fg-muted">—</span>
          <span aria-hidden="true" className="text-xs text-fg-muted opacity-0 transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100 group-aria-pressed:opacity-100">
            Gap · No evidence
          </span>
        </>
      )}
    </button>
  );
}
