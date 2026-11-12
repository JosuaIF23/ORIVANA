import { Link, useNavigate } from 'react-router';
import { MoreHorizontal, PanelLeftOpen } from 'lucide-react';
import type { ConversationDetail } from '@contracts/types';
import { formatRelativeDay, formatTime } from '@/lib/format';
import { useConversations } from '@/hooks/use-data';
import { Menu } from '@/components/ui/menu';
import { Select } from '@/components/ui/field';

/** Title + project; below 1280 px the conversation list becomes a dropdown here (UI.md §4.5). */
export function ChatHeader({ conversation, listOpen, onExpandList }: { conversation: ConversationDetail | null; listOpen: boolean; onExpandList: () => void }) {
  const navigate = useNavigate();
  const { data: conversations = [] } = useConversations();
  return (
    <header className="flex items-start gap-3 border-b border-subtle px-4 py-4 md:px-8">
      {!listOpen ? (
        <button type="button" onClick={onExpandList} aria-label="Show conversation list" className="hidden size-9 shrink-0 items-center justify-center rounded-control text-fg-secondary hover:bg-elevated hover:text-fg xl:flex">
          <PanelLeftOpen aria-hidden="true" className="size-5" />
        </button>
      ) : null}
      <div className="min-w-0 flex-1">
        <h1 className="truncate text-lg font-semibold text-fg">{conversation?.title ?? 'New conversation'}</h1>
        {conversation ? (
          <p className="text-sm text-fg-secondary">
            {conversation.project_id ? (
              <>
                Project:{' '}
                <Link to={`/projects/${conversation.project_id}`} className="underline underline-offset-4 hover:text-fg">
                  {conversation.project_name}
                </Link>{' '}
                ·{' '}
              </>
            ) : null}
            started {formatRelativeDay(conversation.created_at)} {formatTime(conversation.created_at)}
          </p>
        ) : null}
      </div>
      <div className="w-48 xl:hidden">
        <label htmlFor="conv-switch" className="sr-only">
          Switch conversation
        </label>
        <Select id="conv-switch" value={conversation?.id ?? ''} onChange={(e) => navigate(`/assistant/${e.target.value}`)}>
          {conversation ? null : <option value="">New conversation</option>}
          {conversations.map((c) => (
            <option key={c.id} value={c.id}>
              {c.title}
            </option>
          ))}
        </Select>
      </div>
      <Menu
        trigger={
          <button type="button" aria-label="Conversation options" className="flex size-9 shrink-0 items-center justify-center rounded-control text-fg-secondary hover:bg-elevated hover:text-fg">
            <MoreHorizontal aria-hidden="true" className="size-5" />
          </button>
        }
        items={[
          { label: 'New conversation', onSelect: () => navigate('/assistant/new') },
          { label: 'Open project', onSelect: () => conversation?.project_id && navigate(`/projects/${conversation.project_id}`), disabled: !conversation?.project_id },
        ]}
      />
    </header>
  );
}
