import { useEffect, useMemo, useState } from 'react';
import { Navigate, useParams, useSearchParams } from 'react-router';
import { MessageSquare } from 'lucide-react';
import { cn } from '@/lib/cn';
import { useConversations } from '@/hooks/use-data';
import { EmptyState, ErrorState, LoadingSkeleton } from '@/components/common/states';
import { Dialog } from '@/components/ui/dialog';
import { ConversationList } from './conversation-list';
import { ChatHeader } from './chat-header';
import { MessageThread } from './message-thread';
import { Composer } from './composer';
import { EvidencePanel } from './evidence-panel';
import { useAnswerStream, useConversation } from './use-assistant';

/**
 * Assistant (UI.md §4.5): rail · conversations 280 · chat · evidence 360.
 * Selected citation lives in the URL (?m=<message>&c=<ordinal>) so it deep-links.
 */
export default function AssistantPage() {
  const { conversationId: routeId } = useParams();
  const isNew = routeId === 'new';
  const conversationId = isNew ? undefined : routeId;
  const [params, setParams] = useSearchParams();
  const streamId = params.get('stream');
  const conversations = useConversations();
  const conversation = useConversation(conversationId);
  const live = useAnswerStream(conversationId, streamId);
  const [listOpen, setListOpen] = useState(true);
  const [evidenceOpen, setEvidenceOpen] = useState(false);

  // Drop ?stream once the answer is stored, so a reload doesn't reopen it.
  useEffect(() => {
    if (live?.finished && conversation.data?.messages.some((m) => m.id === live.messageId)) {
      setParams((p) => {
        p.delete('stream');
        return p;
      }, { replace: true });
    }
  }, [live?.finished, live?.messageId, conversation.data, setParams]);

  const messages = conversation.data?.messages ?? [];
  const fallback = useMemo(() => [...messages].reverse().find((m) => m.role === 'assistant' && m.citations.length), [messages]);
  const selectedMessageId = params.get('m') ?? fallback?.id ?? null;
  const selectedOrdinal = Number(params.get('c') ?? 1);
  const selectedMessage = messages.find((m) => m.id === selectedMessageId) ?? null;

  function selectCitation(messageId: string, ordinal: number) {
    setParams((p) => {
      p.set('m', messageId);
      p.set('c', String(ordinal));
      return p;
    }, { replace: true });
    if (!window.matchMedia('(min-width: 1024px)').matches) setEvidenceOpen(true);
  }

  if (!conversationId && !isNew) {
    if (conversations.isPending) return <LoadingSkeleton className="p-8" label="Loading conversations…" />;
    const first = conversations.data?.[0];
    if (first) return <Navigate to={`/assistant/${first.id}`} replace />;
  }

  const evidence = <EvidencePanel message={selectedMessage} ordinal={selectedOrdinal} conversationId={conversationId ?? null} onSelect={(n) => selectedMessage && selectCitation(selectedMessage.id, n)} />;

  return (
    <div className={cn('grid h-[calc(100dvh-var(--topbar-height)-80px)] md:h-[calc(100dvh-var(--topbar-height))]', listOpen ? 'xl:grid-cols-[280px_minmax(0,1fr)_360px]' : 'xl:grid-cols-[minmax(0,1fr)_360px]', 'lg:grid-cols-[minmax(0,1fr)_340px]')}>
      {listOpen ? <ConversationList className="hidden xl:flex" activeId={conversationId} onCollapse={() => setListOpen(false)} /> : null}
      <section aria-label="Conversation" className="flex min-h-0 min-w-0 flex-col border-r border-subtle">
        <ChatHeader conversation={conversation.data ?? null} listOpen={listOpen} onExpandList={() => setListOpen(true)} />
        <div className="min-h-0 flex-1 overflow-y-auto">
          {!conversationId ? (
            <EmptyState icon={<MessageSquare />} title="Ask your first question" description="Answers cite the page and section they come from. Pick a project scope below and ask." />
          ) : conversation.isPending ? (
            <LoadingSkeleton className="p-8" rows={5} label="Loading conversation…" />
          ) : conversation.error ? (
            <ErrorState className="m-8" error={conversation.error} onRetry={() => conversation.refetch()} />
          ) : (
            <MessageThread key={conversation.data.id} conversation={conversation.data} live={live} selected={{ messageId: selectedMessageId, ordinal: selectedOrdinal }} onSelectCitation={selectCitation} />
          )}
        </div>
        <Composer conversation={conversation.data ?? null} streamingId={live && !live.finished ? live.messageId : null} />
      </section>
      <aside aria-label="Evidence" className="hidden min-h-0 overflow-y-auto bg-app lg:block">
        {evidence}
      </aside>
      <Dialog open={evidenceOpen} onOpenChange={setEvidenceOpen} title="Evidence" className="lg:hidden">
        {evidence}
      </Dialog>
    </div>
  );
}
