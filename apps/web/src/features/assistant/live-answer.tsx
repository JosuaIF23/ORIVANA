import { Check, Circle } from 'lucide-react';
import { cn } from '@/lib/cn';
import { Spinner } from '@/components/ui/spinner';
import { Skeleton } from '@/components/ui/primitives';
import { AnswerMarkdown } from './answer-markdown';
import { AssistantByline } from './assistant-byline';
import type { LiveAnswer } from './use-assistant';

/** The answer while it streams: retrieval status, then tokens and citations. */
export function LiveAnswerView({ live }: { live: LiveAnswer; conversationId: string }) {
  const status = live.status;
  const retrieving = !live.content;
  return (
    <article aria-busy={!live.finished} className="flex flex-col gap-4">
      {retrieving ? (
        <div role="status" aria-live="polite" className="flex flex-col gap-4">
          <p className="flex items-center gap-3 text-lg">
            <Spinner className="size-5 text-accent" />
            <span className="font-semibold text-fg">{status?.phase === 'generating' ? 'Generating answer…' : 'Retrieving sources…'}</span>
            {status ? (
              <span className="text-fg-secondary">
                {status.passages_found} passages found in {status.sources_found} sources
              </span>
            ) : null}
          </p>
          {status ? (
            <ul className="flex flex-col gap-2 text-base">
              {status.steps.map((step) => (
                <li key={step.label} className={cn('flex items-center gap-3', step.state === 'pending' ? 'text-fg-muted' : step.state === 'active' ? 'text-fg' : 'text-fg-secondary')}>
                  {step.state === 'done' ? <Check aria-hidden="true" className="size-4 text-knowledge" /> : step.state === 'active' ? <Spinner className="text-accent" /> : <Circle aria-hidden="true" className="size-4" />}
                  {step.label}
                </li>
              ))}
            </ul>
          ) : null}
          <div className="flex flex-col gap-3" aria-hidden="true">
            <Skeleton className="h-4 w-[88%]" />
            <Skeleton className="h-4 w-[80%]" />
            <Skeleton className="h-4 w-[55%]" />
          </div>
          {status?.sources.length ? (
            <ul className="flex flex-wrap gap-2">
              {status.sources.slice(0, 3).map((s) => (
                <li key={s.label} className="rounded-control border border-control px-3 py-1.5 text-sm text-fg">
                  {s.label} · {s.passages}
                  {s === status.sources[0] ? ' passages' : ''}
                </li>
              ))}
              {status.sources.length > 3 ? <li className="rounded-control border border-control px-3 py-1.5 text-sm text-fg">+{status.sources.length - 3} more</li> : null}
            </ul>
          ) : null}
        </div>
      ) : (
        <>
          <AssistantByline at={null} detail="writing the answer…" />
          <AnswerMarkdown content={live.content} available={new Set(live.citations.map((c) => c.ordinal))} selected={null} labels={new Map(live.citations.map((c) => [c.ordinal, c.source_label]))} />
        </>
      )}
    </article>
  );
}
