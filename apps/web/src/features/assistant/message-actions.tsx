import { useState } from 'react';
import { useNavigate } from 'react-router';
import { BookmarkPlus, Copy, FileText, Flag, Quote } from 'lucide-react';
import type { Message } from '@contracts/types';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/common/toast';
import { SaveAsDecisionSheet } from './save-decision-sheet';
import { useConversation, useFlagIncorrect } from './use-assistant';

/** Copy · Open source · Explore in Claims · Save as decision · Flag incorrect (UI.md v2 §4.5). */
export function MessageActions({ message }: { message: Message }) {
  const navigate = useNavigate();
  const toast = useToast();
  const flag = useFlagIncorrect();
  const { data: conversation } = useConversation(message.conversation_id);
  const [saving, setSaving] = useState(false);
  const first = message.citations[0];
  const claim = message.related_entities.find((e) => e.entity_type === 'claim');
  const topic = message.related_entities[0];
  const claimsHref = claim ? `/knowledge/claims?claim=${claim.id}` : topic ? `/knowledge/claims?q=${encodeURIComponent(topic.name.split(' ')[0])}` : '/knowledge/claims';

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
      <Button variant="ghost" size="sm" onClick={() => navigate(claimsHref)}>
        <Quote aria-hidden="true" />
        Explore in Claims
      </Button>
      <Button variant="ghost" size="sm" disabled={!message.citations.length} onClick={() => setSaving(true)}>
        <BookmarkPlus aria-hidden="true" />
        Save as decision
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
      {saving ? <SaveAsDecisionSheet message={message} projectId={conversation?.project_id ?? null} open onOpenChange={setSaving} /> : null}
    </div>
  );
}
