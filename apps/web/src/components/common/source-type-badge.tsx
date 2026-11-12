import { FileText, Library, NotebookText } from 'lucide-react';
import type { SourceType } from '@contracts/types';
import { cn } from '@/lib/cn';
import { SOURCE_TYPE_LABEL } from '@/lib/labels';

const ICON = { pdf: FileText, markdown: NotebookText, txt: NotebookText, zotero: Library } as const;

/** PDF / Markdown / TXT / Zotero type badge (UI.md §5), always icon + text. */
export function SourceTypeBadge({ type, className }: { type: SourceType; className?: string }) {
  const Icon = ICON[type];
  return (
    <span
      className={cn(
        'inline-flex h-6 shrink-0 items-center gap-1.5 rounded-badge border px-2 text-xs font-medium whitespace-nowrap',
        type === 'zotero' ? 'border-knowledge/50 text-knowledge' : 'border-control/70 text-fg-secondary',
        className,
      )}
    >
      <Icon aria-hidden="true" className="size-3.5" />
      {SOURCE_TYPE_LABEL[type]}
    </span>
  );
}
