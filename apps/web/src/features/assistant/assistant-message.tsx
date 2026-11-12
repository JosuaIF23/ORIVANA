import type { Message } from '@contracts/types';
import { AnswerMarkdown } from './answer-markdown';
import { AssistantByline } from './assistant-byline';
import { Limitations, RelatedEntities, SourcesCited } from './answer-parts';
import { ConflictAnswer } from './conflict-answer';
import { NoEvidenceAnswer } from './no-evidence-answer';
import { CancelledAnswer, FailedAnswer } from './failed-answer';
import { MessageActions } from './message-actions';
import { InlineProposal } from './inline-proposal';

interface Props {
  message: Message;
  sourceCount: number;
  selectedOrdinal: number | null;
  onSelectCitation: (ordinal: number) => void;
}

/** Assistant message anatomy (UI.md §4.5) for every answer kind and state. */
export function AssistantMessage({ message, sourceCount, selectedOrdinal, onSelectCitation }: Props) {
  if (message.status === 'error') return <FailedAnswer message={message} />;
  if (message.status === 'cancelled') return <CancelledAnswer message={message} />;

  const cite = {
    available: new Set(message.citations.map((c) => c.ordinal)),
    labels: new Map(message.citations.map((c) => [c.ordinal, `${c.source_label}, page ${c.page}`])),
    selected: selectedOrdinal,
    onSelect: onSelectCitation,
  };
  const searched = message.sources_searched ?? sourceCount;
  const detail = message.answer_kind === 'no_evidence' ? `searched ${searched} sources` : `answered from ${message.sources_used ?? message.citations.length} of ${searched} sources`;

  return (
    <article className="flex flex-col gap-5" aria-label="ORIVANA answer">
      <AssistantByline at={message.created_at} detail={detail} />
      {message.answer_kind === 'no_evidence' ? (
        <NoEvidenceAnswer message={message} cite={cite} />
      ) : message.answer_kind === 'conflicting' ? (
        <ConflictAnswer message={message} cite={cite} />
      ) : (
        <>
          <AnswerMarkdown content={message.content} {...cite} className="text-lg leading-8" />
          {message.limitations ? <Limitations text={message.limitations} /> : null}
          {message.proposal_id ? <InlineProposal proposalId={message.proposal_id} /> : null}
          {message.citations.length ? <SourcesCited citations={message.citations} selected={selectedOrdinal} onSelect={onSelectCitation} /> : null}
          {message.related_entities.length ? <RelatedEntities entities={message.related_entities} /> : null}
        </>
      )}
      {message.answer_kind !== 'no_evidence' ? <MessageActions message={message} /> : null}
    </article>
  );
}
