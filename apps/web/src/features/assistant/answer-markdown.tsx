import { Fragment, type ReactNode } from 'react';
import { CitationChip } from '@/components/common/citation';
import { cn } from '@/lib/cn';

interface CitationRenderProps {
  /** Ordinals that have arrived (others render as pending/missing). */
  available: Set<number>;
  selected: number | null;
  labels: Map<number, string>;
  onSelect?: (ordinal: number) => void;
}

const INLINE = /(\*\*[^*]+\*\*|`[^`]+`|\[\d+\])/g;

function renderInline(text: string, cite: CitationRenderProps): ReactNode[] {
  return text.split(INLINE).map((part, i) => {
    if (!part) return null;
    if (part.startsWith('**')) return <strong key={i} className="font-semibold text-fg">{part.slice(2, -2)}</strong>;
    if (part.startsWith('`')) return <code key={i} className="rounded-badge bg-elevated px-1 font-mono text-[0.9em]">{part.slice(1, -1)}</code>;
    const match = part.match(/^\[(\d+)\]$/);
    if (match) {
      const n = Number(match[1]);
      return <CitationChip key={i} ordinal={n} label={cite.labels.get(n)} selected={cite.selected === n} missing={!cite.available.has(n)} onSelect={cite.onSelect} className="mx-0.5" />;
    }
    return <Fragment key={i}>{part}</Fragment>;
  });
}

/**
 * Renders the small Markdown subset the API returns (paragraphs, "- " lists,
 * **bold**, `code`) with numbered citation chips.
 */
export function AnswerMarkdown({ content, className, ...cite }: CitationRenderProps & { content: string; className?: string }) {
  const blocks = content.split(/\n{2,}/);
  return (
    <div className={cn('flex flex-col gap-4 text-base text-fg', className)}>
      {blocks.map((block, i) => {
        const lines = block.split('\n');
        if (lines.every((l) => l.startsWith('- '))) {
          return (
            <ul key={i} className="flex list-disc flex-col gap-2 pl-6 marker:text-fg-secondary">
              {lines.map((l, j) => (
                <li key={j}>{renderInline(l.slice(2), cite)}</li>
              ))}
            </ul>
          );
        }
        return <p key={i}>{renderInline(block, cite)}</p>;
      })}
    </div>
  );
}
