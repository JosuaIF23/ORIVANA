import { useState, type KeyboardEvent } from 'react';
import { TriangleAlert, X } from 'lucide-react';
import { cn } from '@/lib/cn';

/** Label chips; labels missing in the repository are dashed with a warning. */
export function LabelEditor({ labels, unknown, repository, onChange }: { labels: string[]; unknown: string[]; repository: string; onChange: (labels: string[]) => void }) {
  const [draft, setDraft] = useState('');
  function onKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if ((e.key === 'Enter' || e.key === ',') && draft.trim()) {
      e.preventDefault();
      if (!labels.includes(draft.trim())) onChange([...labels, draft.trim()]);
      setDraft('');
    }
  }
  return (
    <fieldset>
      <legend className="text-sm font-medium text-fg-secondary">Labels</legend>
      <ul className="mt-2 flex flex-wrap items-center gap-2">
        {labels.map((l) => {
          const bad = unknown.includes(l);
          return (
            <li key={l} className={cn('flex h-9 items-center gap-2 rounded-full border pr-1 pl-4 text-sm text-fg', bad ? 'border-dashed border-warning' : 'border-control')}>
              {l}
              {bad ? <span className="sr-only">(not in repository)</span> : null}
              <button type="button" aria-label={`Remove label ${l}`} onClick={() => onChange(labels.filter((x) => x !== l))} className="flex size-7 items-center justify-center rounded-full text-fg-secondary hover:bg-elevated hover:text-fg">
                <X aria-hidden="true" className="size-4" />
              </button>
            </li>
          );
        })}
        <li>
          <label htmlFor="add-label" className="sr-only">
            Add label
          </label>
          <input id="add-label" name="label" autoComplete="off" value={draft} onChange={(e) => setDraft(e.target.value)} onKeyDown={onKeyDown} placeholder="Add label…" className="h-9 w-48 rounded-control border border-control bg-app px-3 text-sm text-fg" />
        </li>
      </ul>
      {unknown.length ? (
        <p aria-live="polite" className="mt-2 flex items-start gap-2 text-sm text-warning">
          <TriangleAlert aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
          {unknown.map((l) => `“${l}”`).join(', ')} {unknown.length === 1 ? 'doesn’t' : 'don’t'} exist in {repository}. ORIVANA won’t create labels, so validation will ask you to remove {unknown.length === 1 ? 'it' : 'them'}.
        </p>
      ) : null}
    </fieldset>
  );
}
