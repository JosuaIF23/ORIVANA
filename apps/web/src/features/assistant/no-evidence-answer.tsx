import { Plus, SearchX } from 'lucide-react';
import type { Message } from '@contracts/types';
import { sectionLabel } from '@/lib/format';
import { useMe } from '@/hooks/use-session';
import { ButtonLink } from '@/components/ui/button';
import { AnswerMarkdown } from './answer-markdown';

interface Cite {
  available: Set<number>;
  labels: Map<number, string>;
  selected: number | null;
  onSelect: (n: number) => void;
}

/** The answer abstains and suggests adding a source (UI.md §4.5). */
export function NoEvidenceAnswer({ message, cite }: { message: Message; cite: Cite }) {
  const { data: me } = useMe();
  const closest = message.citations[0];
  const topic = message.related_entities[0]?.name ?? '';
  return (
    <div className="flex flex-col gap-4">
      <div className="rounded-card border border-subtle bg-surface p-6">
        <h3 className="flex items-center gap-3 text-lg font-semibold text-fg">
          <SearchX aria-hidden="true" className="size-5 text-warning" />
          No evidence found in your sources
        </h3>
        <p className="mt-3 text-lg text-fg">{message.content}</p>
        {message.limitations ? (
          <div className="mt-3 flex flex-wrap items-center gap-2 text-base text-fg-secondary">
            <AnswerMarkdown content={message.limitations} {...cite} className="inline text-fg-secondary" />
            {closest ? (
              <span className="text-sm">
                p. {closest.page} · {sectionLabel(closest.section, true)} {closest.section.replace(/^[\d.]+\s*/, '')}
              </span>
            ) : null}
          </div>
        ) : null}
      </div>
      <div>
        <p className="text-sm text-fg-secondary">What you can do</p>
        <div className="mt-3 flex flex-wrap gap-3">
          <ButtonLink to="/knowledge/sources?upload=1" variant="primary" size="lg">
            <Plus aria-hidden="true" />
            Add a source
          </ButtonLink>
          <ButtonLink to={`/search?q=${encodeURIComponent(topic)}`} size="lg">
            Search all workspace sources ({me?.counts.sources ?? 0})
          </ButtonLink>
        </div>
        {message.suggestion ? <p className="mt-3 text-sm text-fg-muted">{message.suggestion}</p> : null}
      </div>
    </div>
  );
}
