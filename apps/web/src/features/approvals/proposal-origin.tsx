import { Link } from 'react-router';
import { CircleAlert, GitBranch, MessageSquare, User } from 'lucide-react';
import type { ActionProposal } from '@contracts/types';

/** Where a proposal came from (UI.md §4.13): a Decision Impact alert, a conversation, or you. */
export function ProposalOrigin({ proposal: p, compact = false }: { proposal: ActionProposal; compact?: boolean }) {
  const origin = p.origin ?? (p.conversation_id ? { type: 'assistant' as const, id: p.conversation_id, label: `From conversation: ${p.conversation_title}` } : null);
  if (!origin) return null;
  const icon = origin.type === 'decision_alert' ? <CircleAlert className="text-warning" /> : origin.type === 'assistant' ? <MessageSquare /> : <User />;
  const href = origin.type === 'decision_alert' && origin.id ? `/decision-alerts/${origin.id}` : origin.type === 'assistant' && origin.id ? `/assistant/${origin.id}` : null;
  if (compact) {
    return (
      <span className="flex items-center gap-1.5 text-xs text-fg-secondary [&_svg]:size-3.5">
        <span aria-hidden="true">{icon}</span>
        <span className="truncate">{origin.label}</span>
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1.5 [&_svg]:size-4">
      <span aria-hidden="true">{icon}</span>
      <span className="text-fg-secondary">Origin:</span>
      {href ? (
        <Link to={href} className="text-accent underline underline-offset-4 hover:text-fg">
          {origin.label}
        </Link>
      ) : (
        <span className="text-fg">{origin.label}</span>
      )}
    </span>
  );
}

/** "Linked to decision" chip shown after the issue exists (UI.md §4.13). */
export function LinkedDecisionChip({ proposal: p }: { proposal: ActionProposal }) {
  if (!p.linked_decision) return null;
  return (
    <Link to={`/knowledge/memory?decision=${p.linked_decision.id}`} className="inline-flex h-8 items-center gap-2 rounded-full border border-knowledge/50 px-3 text-sm text-knowledge hover:text-fg">
      <GitBranch aria-hidden="true" className="size-4" />
      Linked to decision {p.linked_decision.code ?? ''}
      <span className="sr-only">: {p.linked_decision.title}</span>
    </Link>
  );
}
