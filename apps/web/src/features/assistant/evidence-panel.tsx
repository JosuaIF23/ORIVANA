import { Link } from 'react-router';
import { ChevronLeft, ChevronRight, FileText, TextQuote } from 'lucide-react';
import type { Message } from '@contracts/types';
import { formatDate, plural, sectionLabel } from '@/lib/format';
import { ButtonLink } from '@/components/ui/button';
import { CitationChip, EvidencePassage } from '@/components/common/citation';
import { EmptyState } from '@/components/common/states';
import { MetaList } from '@/components/ui/primitives';
import { useSource } from '@/features/sources/use-sources';
import { SOURCE_TYPE_LABEL } from '@/lib/labels';

interface Props {
  message: Message | null;
  ordinal: number;
  conversationId: string | null;
  onSelect: (ordinal: number) => void;
}

const TYPE = SOURCE_TYPE_LABEL;

/** Selected citation's passage with the quoted span highlighted (UI.md §4.5). */
export function EvidencePanel({ message, ordinal, conversationId, onSelect }: Props) {
  const citations = message?.citations ?? [];
  const index = Math.max(0, citations.findIndex((c) => c.ordinal === ordinal));
  const citation = citations[index];
  const { data: source, error } = useSource(citation?.source_id);

  if (!message || !citation) {
    return <EmptyState className="py-16" icon={<TextQuote />} title="Evidence appears here" description="Select a numbered citation in an answer to see the exact passage it comes from." />;
  }

  const others = citations.filter((c) => c.ordinal !== citation.ordinal);
  const added = source ? [formatDate(source.created_at), TYPE[source.type], source.page_count ? plural(source.page_count, 'page') : null].filter(Boolean).join(' · ') : '—';

  return (
    <div className="flex flex-col">
      <div className="flex items-center gap-2 border-b border-subtle px-6 py-4">
        <h2 className="flex-1 truncate text-base font-semibold text-fg">
          Evidence <span className="font-normal text-fg-secondary">· citation {index + 1} of {citations.length}</span>
        </h2>
        <button type="button" aria-label="Previous citation" disabled={index === 0} onClick={() => onSelect(citations[index - 1].ordinal)} className="flex size-9 items-center justify-center rounded-control text-fg-secondary hover:bg-elevated hover:text-fg disabled:opacity-40">
          <ChevronLeft aria-hidden="true" className="size-5" />
        </button>
        <button type="button" aria-label="Next citation" disabled={index === citations.length - 1} onClick={() => onSelect(citations[index + 1].ordinal)} className="flex size-9 items-center justify-center rounded-control text-fg-secondary hover:bg-elevated hover:text-fg disabled:opacity-40">
          <ChevronRight aria-hidden="true" className="size-5" />
        </button>
      </div>
      <div className="flex flex-col gap-5 px-6 py-5" aria-live="polite">
        <div className="flex items-start gap-3">
          <CitationChip ordinal={citation.ordinal} selected />
          <div className="min-w-0">
            <p className="text-base font-semibold text-fg">{citation.source_title}</p>
            <p className="text-sm text-fg-secondary">{citation.source_meta}</p>
          </div>
        </div>
        <MetaList
          labelWidth="w-20"
          rows={[
            ['Page', citation.page],
            ['Section', citation.section],
            ['Added', added],
          ]}
        />
        {error ? <p className="text-sm text-warning">This source is no longer in your workspace; the quote below is kept from the answer.</p> : null}
        <div className="rounded-card border border-subtle bg-surface p-5">
          <EvidencePassage passage={citation.passage} start={citation.char_start} end={citation.char_end} />
        </div>
        <ButtonLink to={`/knowledge/sources/${citation.source_id}?page=${citation.page}&from=${conversationId}:${message.id}:${citation.ordinal}`} className="self-start" size="lg">
          <FileText aria-hidden="true" />
          Open in document · p. {citation.page}
        </ButtonLink>
        {others.length ? (
          <section aria-label="Other passages used in this answer">
            <h3 className="text-sm font-medium text-fg-secondary">Other passages used in this answer</h3>
            <ul className="mt-3 flex flex-col gap-3">
              {others.map((c) => (
                <li key={c.id}>
                  <button type="button" onClick={() => onSelect(c.ordinal)} className="w-full rounded-card border border-subtle bg-surface p-4 text-left hover:border-control">
                    <span className="flex items-center gap-3 text-sm">
                      <CitationChip ordinal={c.ordinal} />
                      <span className="font-semibold text-fg">{c.source_label}</span>
                      <span className="text-fg-secondary">
                        p. {c.page} · {sectionLabel(c.section, true)}
                      </span>
                    </span>
                    <span className="mt-2 block text-sm text-fg-secondary">“…{c.quote}…”</span>
                  </button>
                </li>
              ))}
            </ul>
          </section>
        ) : null}
        <p className="text-xs text-fg-muted">
          Open the <Link to={`/knowledge/map?focus=${message.related_entities[0]?.id ?? ''}&candidates=1`} className="underline underline-offset-4 hover:text-fg">map</Link> to see how these sources relate.
        </p>
      </div>
    </div>
  );
}
