import { useState, type KeyboardEvent } from 'react';
import { useNavigate, useSearchParams } from 'react-router';
import { ArrowUp, Folder, Paperclip, Square } from 'lucide-react';
import type { ConversationDetail } from '@contracts/types';
import { plural } from '@/lib/format';
import { useProjectsList } from '@/hooks/use-data';
import { Button } from '@/components/ui/button';
import { Select } from '@/components/ui/field';
import { useCancelMessage, useSendMessage } from './use-assistant';

/** Composer: Enter sends, Shift+Enter adds a line; Stop while streaming (UI.md §4.5). */
export function Composer({ conversation, streamingId }: { conversation: ConversationDetail | null; streamingId: string | null }) {
  const navigate = useNavigate();
  const { data: projects = [] } = useProjectsList();
  const send = useSendMessage();
  const cancel = useCancelMessage();
  const [text, setText] = useState('');
  const [params] = useSearchParams();
  const [projectId, setProjectId] = useState<string | null>(() => params.get('project'));
  const scopeId = projectId ?? conversation?.project_id ?? projects[0]?.id ?? '';
  const project = projects.find((p) => p.id === scopeId);
  const scope = project ? `Project ${project.name} · ${plural(project.counts.sources, 'source')}` : 'All of workspace';

  function submit() {
    const content = text.trim();
    if (!content || streamingId || send.isPending) return;
    send.mutate(
      { conversationId: conversation?.id ?? null, content, projectId: scopeId || null },
      {
        onSuccess: (res) => {
          setText('');
          navigate(`/assistant/${res.conversation_id}?stream=${res.message_id}`, { replace: Boolean(conversation) });
        },
      },
    );
  }

  function onKeyDown(e: KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) {
      e.preventDefault();
      submit();
    }
  }

  return (
    <div className="border-t border-subtle px-4 py-4 md:px-8">
      <div className="mx-auto max-w-[860px] rounded-card border border-control bg-surface focus-within:border-accent focus-within:ring-2 focus-within:ring-accent/70">
        <label htmlFor="composer" className="sr-only">
          Ask a follow-up
        </label>
        <textarea
          id="composer"
          name="message"
          autoComplete="off"
          rows={2}
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={onKeyDown}
          placeholder="Ask a follow-up about your sources…"
          className="block w-full resize-none bg-transparent px-4 pt-3 text-base text-fg outline-none"
          aria-describedby="composer-hint"
        />
        <div className="flex flex-wrap items-center gap-2 px-3 pt-1 pb-3">
          <Button variant="ghost" size="icon-sm" aria-label="Attach a source" onClick={() => navigate('/knowledge/sources?upload=1')}>
            <Paperclip aria-hidden="true" />
          </Button>
          <div className="relative">
            <Folder aria-hidden="true" className="pointer-events-none absolute top-1/2 left-3 z-10 size-4 -translate-y-1/2 text-fg-secondary" />
            <label htmlFor="composer-scope" className="sr-only">
              Project scope
            </label>
            <Select id="composer-scope" className="w-48 [&_select]:h-9 [&_select]:pl-9 [&_select]:font-medium" value={scopeId} onChange={(e) => setProjectId(e.target.value)} disabled={Boolean(streamingId)}>
              <option value="">All of workspace</option>
              {projects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </Select>
          </div>
          <p id="composer-hint" className="min-w-0 flex-1 truncate text-sm text-fg-secondary">
            <span className="hidden md:inline">Searching: {scope}</span>
            <span className="ml-3 hidden text-fg-muted lg:inline">Enter to send · Shift+Enter new line</span>
          </p>
          {streamingId && conversation ? (
            <Button onClick={() => cancel.mutate({ conversationId: conversation.id, messageId: streamingId })} loading={cancel.isPending} loadingText="Stopping…">
              <Square aria-hidden="true" className="fill-current" />
              Stop
            </Button>
          ) : (
            <Button variant="primary" onClick={submit} loading={send.isPending} loadingText="Sending…" disabled={!text.trim()}>
              <ArrowUp aria-hidden="true" />
              Send
            </Button>
          )}
        </div>
      </div>
      {send.error ? <p role="alert" className="mx-auto mt-2 max-w-[860px] text-sm text-danger">{send.error.message}</p> : null}
    </div>
  );
}
