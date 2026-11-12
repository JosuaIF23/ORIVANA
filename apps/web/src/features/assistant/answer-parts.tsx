import { Link } from 'react-router';
import { CircleAlert } from 'lucide-react';
import type { Message, MessageCitation } from '@contracts/types';
import { cn } from '@/lib/cn';
import { sectionLabel } from '@/lib/format';
import { CitationChip } from '@/components/common/citation';
import { EntityTypeIcon } from '@/components/common/entity-icon';

export function Limitations({ text }: { text: string }) {
  return (
    <div className="flex gap-3 rounded-card border border-subtle bg-surface p-4 text-base text-fg-secondary">
      <CircleAlert aria-hidden="true" className="mt-1 size-5 shrink-0 text-warning" />
      <p>
        <strong className="font-semibold text-fg">Limitations:</strong> {text}
      </p>
    </div>
  );
}

/** Citation list under an answer: source title, page, section. */
export function SourcesCited({ citations, selected, onSelect }: { citations: MessageCitation[]; selected: number | null; onSelect: (n: number) => void }) {
  return (
    <section aria-label="Sources cited">
      <h3 className="text-sm font-medium text-fg-secondary">Sources cited</h3>
      <ul className="mt-2 overflow-hidden rounded-card border border-subtle">
        {citations.map((c) => (
          <li key={c.id} className="border-b border-subtle last:border-b-0">
            <button
              type="button"
              onClick={() => onSelect(c.ordinal)}
              aria-pressed={selected === c.ordinal}
              className={cn('flex w-full items-center gap-4 px-4 py-3 text-left transition-colors', selected === c.ordinal ? 'bg-elevated' : 'bg-surface hover:bg-elevated/60')}
            >
              <CitationChip ordinal={c.ordinal} selected={selected === c.ordinal} />
              <span className="min-w-0 flex-1">
                <span className="block truncate text-base text-fg">{c.source_title}</span>
                <span className="block text-sm text-fg-secondary">{c.source_meta}</span>
              </span>
              <span className="hidden shrink-0 text-sm text-fg-secondary sm:block">
                p. {c.page} · {sectionLabel(c.section)}
              </span>
            </button>
          </li>
        ))}
      </ul>
    </section>
  );
}

export function RelatedEntities({ entities }: { entities: Message['related_entities'] }) {
  return (
    <section aria-label="Related entities" className="flex flex-wrap items-center gap-2">
      <h3 className="mr-1 text-sm font-medium text-fg-secondary">Related</h3>
      {entities.map((e) => (
        <Link key={e.id} to={`/knowledge/graph?focus=${e.id}`} className="inline-flex h-8 items-center gap-2 rounded-full border border-control px-3 text-sm text-fg hover:border-fg-muted">
          <EntityTypeIcon type={e.entity_type} className="size-3.5" />
          {e.name}
        </Link>
      ))}
    </section>
  );
}
