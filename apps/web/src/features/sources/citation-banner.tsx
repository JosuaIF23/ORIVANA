import { Link } from 'react-router';
import type { MessageCitation } from '@contracts/types';
import { CitationChip } from '@/components/common/citation';

/** "Opened from citation 2 in … · the cited passage is highlighted below." */
export function CitationBanner({ citation, conversationId, conversationTitle, messageId }: { citation: MessageCitation; conversationId: string; conversationTitle: string; messageId: string }) {
  const back = `/assistant/${conversationId}?m=${messageId}&c=${citation.ordinal}`;
  return (
    <div role="status" className="flex flex-wrap items-center gap-4 rounded-card border border-accent/50 bg-accent/5 px-5 py-4 text-base text-fg-secondary">
      <CitationChip ordinal={citation.ordinal} selected />
      <p className="min-w-0 flex-1">
        Opened from citation {citation.ordinal} in{' '}
        <Link to={back} className="text-accent underline underline-offset-4 hover:text-fg">
          {conversationTitle}
        </Link>{' '}
        · the cited passage is highlighted below.
      </p>
      <Link to={back} className="rounded-control text-base font-medium text-fg hover:underline hover:underline-offset-4">
        Back to answer
      </Link>
    </div>
  );
}
