import { useEffect, useRef } from 'react';
import type { ConversationDetail } from '@contracts/types';
import { formatTime } from '@/lib/format';
import { AssistantMessage } from './assistant-message';
import { LiveAnswerView } from './live-answer';
import type { LiveAnswer } from './use-assistant';

interface Props {
  conversation: ConversationDetail;
  live: LiveAnswer | null;
  selected: { messageId: string | null; ordinal: number };
  onSelectCitation: (messageId: string, ordinal: number) => void;
}

export function MessageThread({ conversation, live, selected, onSelectCitation }: Props) {
  const endRef = useRef<HTMLDivElement>(null);
  const showLive = live && !conversation.messages.some((m) => m.id === live.messageId);
  const liveLength = live?.content.length ?? 0;

  // Follow the answer while it streams or when a new message arrives — not on first load.
  const initialCount = useRef(conversation.messages.length);
  useEffect(() => {
    if (liveLength > 0 || conversation.messages.length > initialCount.current || showLive) {
      endRef.current?.scrollIntoView({ block: 'end' });
    }
  }, [conversation.messages.length, liveLength, showLive]);

  return (
    <div className="mx-auto flex max-w-[860px] flex-col gap-8 px-4 py-6 md:px-8">
      {conversation.messages.map((m) =>
        m.role === 'user' ? (
          <div key={m.id} className="flex flex-col items-end gap-2 pl-10 md:pl-20">
            <span className="text-sm text-fg-secondary">You · {formatTime(m.created_at)}</span>
            <p className="rounded-card border border-subtle bg-elevated px-5 py-4 text-lg text-fg">{m.content}</p>
          </div>
        ) : (
          <AssistantMessage
            key={m.id}
            message={m}
            sourceCount={conversation.scope.source_count}
            selectedOrdinal={selected.messageId === m.id ? selected.ordinal : null}
            onSelectCitation={(n) => onSelectCitation(m.id, n)}
          />
        ),
      )}
      {showLive ? <LiveAnswerView live={live} conversationId={conversation.id} /> : null}
      <div ref={endRef} />
    </div>
  );
}
