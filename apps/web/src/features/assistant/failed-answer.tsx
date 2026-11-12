import { useSearchParams } from 'react-router';
import { TriangleAlert } from 'lucide-react';
import type { Message } from '@contracts/types';
import { formatTime } from '@/lib/format';
import { Button, ButtonLink } from '@/components/ui/button';
import { StatusBadge } from '@/components/common/status-badge';
import { AnswerMarkdown } from './answer-markdown';
import { useRetryMessage } from './use-assistant';

function useRetry(message: Message) {
  const [, setParams] = useSearchParams();
  const retry = useRetryMessage();
  const run = () =>
    retry.mutate(
      { conversationId: message.conversation_id, messageId: message.id },
      {
        onSuccess: (res) =>
          setParams((p) => {
            p.set('stream', res.message_id);
            return p;
          }),
      },
    );
  return { run, pending: retry.isPending };
}

/** Model error: retrieval finished, retry reruns generation only. */
export function FailedAnswer({ message }: { message: Message }) {
  const retry = useRetry(message);
  return (
    <article role="alert" className="rounded-card border border-subtle bg-surface p-6">
      <span className="inline-flex h-7 items-center gap-2 rounded-badge border border-danger/60 bg-danger/10 px-2.5 text-sm font-medium text-danger">
        <TriangleAlert aria-hidden="true" className="size-4" />
        Answer failed
      </span>
      <h3 className="mt-4 text-lg font-semibold text-fg">{message.error?.message ?? 'The answer could not be generated'}</h3>
      <p className="mt-2 text-base text-fg-secondary">Retrieval finished, so retrying only reruns generation. Nothing was saved to memory.</p>
      <div className="mt-5 flex flex-wrap gap-3">
        {message.error?.retryable !== false ? (
          <Button variant="primary" onClick={retry.run} loading={retry.pending} loadingText="Retrying…">
            Retry answer
          </Button>
        ) : null}
        <ButtonLink to="/knowledge/sources" variant="ghost">
          Show sources
        </ButtonLink>
      </div>
    </article>
  );
}

/** User cancelled: partial answer is kept and marked as cancelled. */
export function CancelledAnswer({ message }: { message: Message }) {
  const retry = useRetry(message);
  return (
    <article className="rounded-card border border-subtle bg-surface p-6" aria-label="Cancelled answer">
      <StatusBadge status="cancelled" label="Cancelled · partial answer" size="md" />
      {message.content ? (
        <AnswerMarkdown
          content={message.content}
          className="mt-4 text-lg text-fg-secondary"
          available={new Set(message.citations.map((c) => c.ordinal))}
          labels={new Map()}
          selected={null}
        />
      ) : null}
      <p className="mt-3 text-sm text-fg-secondary">Generation stopped{message.cancelled_at ? ` at ${formatTime(message.cancelled_at)}` : ''}. Citations for the unfinished part were not validated.</p>
      <Button className="mt-5" onClick={retry.run} loading={retry.pending} loadingText="Regenerating…">
        Regenerate
      </Button>
    </article>
  );
}
