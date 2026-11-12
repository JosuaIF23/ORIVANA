import type { MatrixAxisItem, MatrixResponse } from '@contracts/types';

/**
 * Phones get a list grouped by method instead of a wide table (UI.md §7):
 * "Hybrid retrieval — tested on: NQ, TriviaQA, BEIR · Gaps: HotpotQA".
 */
export function MatrixMobile({ data, methods, datasets, onSelect }: { data: MatrixResponse; methods: MatrixAxisItem[]; datasets: MatrixAxisItem[]; onSelect: (methodId: string, datasetId: string) => void }) {
  return (
    <ul className="flex flex-col gap-3">
      {methods.map((m) => {
        const tested = datasets.filter((d) => data.cells.some((c) => c.method_id === m.id && c.dataset_id === d.id));
        const gaps = datasets.filter((d) => !tested.includes(d));
        return (
          <li key={m.id} className="rounded-card border border-subtle bg-surface p-4">
            <h3 className="text-lg font-semibold text-fg">{m.name}</h3>
            <p className="mt-2 text-sm text-fg-secondary">Tested on</p>
            {tested.length ? (
              <ul className="mt-2 flex flex-wrap gap-2">
                {tested.map((d) => {
                  const cell = data.cells.find((c) => c.method_id === m.id && c.dataset_id === d.id)!;
                  return (
                    <li key={d.id}>
                      <button
                        type="button"
                        onClick={() => onSelect(m.id, d.id)}
                        className={`inline-flex min-h-11 items-center gap-2 rounded-control border px-3 text-sm text-fg ${cell.status === 'candidate' ? 'border-dashed border-warning/70' : 'border-control'}`}
                      >
                        {d.name}
                        <span className="text-fg-secondary tabular">· {cell.paper_ordinals.length}</span>
                        {cell.status === 'candidate' ? <span className="text-xs text-warning">Candidate</span> : null}
                      </button>
                    </li>
                  );
                })}
              </ul>
            ) : (
              <p className="mt-1 text-sm text-fg-muted">No datasets yet</p>
            )}
            {gaps.length ? (
              <p className="mt-3 text-sm text-fg-secondary">
                <span className="font-medium text-fg">Gaps:</span>{' '}
                {gaps.map((d, i) => (
                  <span key={d.id}>
                    <button type="button" onClick={() => onSelect(m.id, d.id)} className="underline decoration-dashed underline-offset-4 hover:text-fg">
                      {d.name}
                    </button>
                    {i < gaps.length - 1 ? ', ' : ''}
                  </span>
                ))}
                <span className="sr-only"> — no evidence in your collection</span>
              </p>
            ) : null}
          </li>
        );
      })}
    </ul>
  );
}
