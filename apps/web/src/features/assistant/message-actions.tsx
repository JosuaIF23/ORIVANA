import { useNavigate } from 'react-router';
import { Copy, FileText, Flag, Waypoints } from 'lucide-react';
import type { Message } from '@contracts/types';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/common/toast';
import { useFlagIncorrect } from './use-assistant';

/** Copy · Open source · Explore relationship · Flag incorrect (UI.md §4.5). */
export function MessageActions({ message }: { message: Message }) {
  const navigate = useNavigate();
  const toast = useToast();
  const flag = useFlagIncorrect();
  const first = message.citations[0];
  const entity = message.related_entities[0];

  async function copy() {
    try {
      await navigator.clipboard.writeText(message.content);
      toast.success('Answer copied');
    } catch {
      toast.error('Copy failed. Select the text and copy it manually.');
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-1 border-t border-subtle pt-3">
      <Button variant="ghost" size="sm" onClick={copy}>
        <Copy aria-hidden="true" />
        Copy
      </Button>
      <Button variant="ghost" size="sm" disabled={!first} onClick={() => first && navigate(`/knowledge/sources/${first.source_id}?page=${first.page}&from=${message.conversation_id}:${message.id}:${first.ordinal}`)}>
        <FileText aria-hidden="true" />
        Open source
      </Button>
      <Button variant="ghost" size="sm" disabled={!entity} onClick={() => entity && navigate(`/knowledge/map?focus=${entity.id}&candidates=1`)}>
        <Waypoints aria-hidden="true" />
        Explore relationship
      </Button>
      <Button
        variant="ghost"
        size="sm"
        className="ml-auto"
        loading={flag.isPending}
        disabled={flag.isSuccess}
        onClick={() => flag.mutate(message.id, { onSuccess: () => toast.success('Flagged as incorrect. Thanks — this answer is marked for review.') })}
      >
        <Flag aria-hidden="true" />
        {flag.isSuccess ? 'Flagged' : 'Flag incorrect'}
      </Button>
    </div>
  );
}
