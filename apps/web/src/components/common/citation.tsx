import { cn } from '@/lib/cn';

interface CitationChipProps {
  ordinal: number;
  label?: string;
  selected?: boolean;
  missing?: boolean;
  onSelect?: (ordinal: number) => void;
  className?: string;
}

/** Numbered inline citation `[1]`. A button when it can open evidence. */
export function CitationChip({ ordinal, label, selected = false, missing = false, onSelect, className }: CitationChipProps) {
  const cls = cn(
    'inline-flex h-6 min-w-6 items-center justify-center rounded-badge border px-1.5 align-baseline text-xs font-semibold tabular',
    selected ? 'border-accent bg-accent text-on-accent' : 'border-accent/50 bg-accent/10 text-accent hover:border-accent hover:bg-accent/20',
    missing && 'border-dashed border-control text-fg-muted',
    className,
  );
  if (!onSelect || missing) {
    return (
      <span className={cls} title={missing ? 'Source deleted' : label}>
        {ordinal}
        {missing ? <span className="sr-only"> (source deleted)</span> : null}
      </span>
    );
  }
  return (
    <button type="button" className={cls} aria-pressed={selected} aria-label={`Citation ${ordinal}${label ? `: ${label}` : ''}`} onClick={() => onSelect(ordinal)}>
      {ordinal}
    </button>
  );
}

/** Passage text with the quoted span highlighted (char offsets are relative to the passage). */
export function EvidencePassage({ passage, start, end, className }: { passage: string; start: number; end: number; className?: string }) {
  const valid = start >= 0 && end > start && end <= passage.length;
  return (
    <p className={cn('text-base text-fg-secondary', className)}>
      {valid ? (
        <>
          {passage.slice(0, start)}
          <mark className="evidence-mark">{passage.slice(start, end)}</mark>
          {passage.slice(end)}
        </>
      ) : (
        passage
      )}
    </p>
  );
}
