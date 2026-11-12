import { ArrowDownUp, Cpu } from 'lucide-react';
import type { Message } from '@contracts/types';
import { sectionLabel } from '@/lib/format';
import { CitationChip } from '@/components/common/citation';

interface Cite {
  selected: number | null;
  onSelect: (n: number) => void;
}

/** "Sources disagree": both sides with citations, plus a labelled inference. */
export function ConflictAnswer({ message, cite }: { message: Message; cite: Cite }) {
  return (
    <div className="flex flex-col gap-5">
      <p className="flex flex-wrap items-center gap-3 text-lg text-fg">
        <span className="inline-flex h-8 items-center gap-2 rounded-badge border border-warning/60 px-3 text-sm font-medium text-warning">
          <ArrowDownUp aria-hidden="true" className="size-4" />
          Sources disagree
        </span>
        {message.content}
      </p>
      <div className="grid gap-4 md:grid-cols-2">
        {message.positions?.map((p) => {
          const c = message.citations.find((x) => x.ordinal === p.citation_ordinal);
          return (
            <section key={p.label} className="rounded-card border border-subtle bg-surface p-5" aria-label={p.label}>
              <p className="text-sm text-fg-secondary">{p.label}</p>
              <h3 className="mt-2 text-base font-semibold text-fg">{p.title}</h3>
              <p className="mt-3 text-base text-fg-secondary">
                <mark className="evidence-mark">{p.quote}</mark>
                {p.context}
              </p>
              {c ? (
                <p className="mt-4 flex items-center gap-3 text-sm text-fg-secondary">
                  <CitationChip ordinal={c.ordinal} label={`${c.source_label}, page ${c.page}`} selected={cite.selected === c.ordinal} onSelect={cite.onSelect} />
                  {c.source_label.replace(/ et al\.| & \w+/, '')} · p. {c.page} · {sectionLabel(c.section, true)}
                </p>
              ) : null}
            </section>
          );
        })}
      </div>
      {message.inference ? (
        <aside className="rounded-card border border-dashed border-control p-5" aria-label="ORIVANA inference">
          <p className="flex items-center gap-2 text-sm font-medium text-fg-secondary">
            <Cpu aria-hidden="true" className="size-4" />
            ORIVANA inference — not stated by either source
          </p>
          <p className="mt-2 text-base text-fg">{message.inference}</p>
        </aside>
      ) : null}
    </div>
  );
}
