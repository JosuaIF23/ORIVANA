import { Link } from 'react-router';
import type { AuditEvent, AuditLink } from '@contracts/types';

/** Internal route (or external URL) for an audit link target. */
export function auditHref(link: AuditLink): { href: string; external: boolean } {
  switch (link.target_type) {
    case 'source':
      return { href: `/knowledge/sources/${link.target_id}`, external: false };
    case 'conversation':
      return { href: `/assistant/${link.target_id}`, external: false };
    case 'proposal':
      return { href: `/approvals/${link.target_id}`, external: false };
    case 'memory':
      return link.target_id.startsWith('dec_') ? { href: `/knowledge/memory?decision=${link.target_id}`, external: false } : { href: `/knowledge/memory?view=memories&status=all&q=${encodeURIComponent(link.label.slice(0, 24))}`, external: false };
    case 'project':
      return { href: `/projects/${link.target_id}`, external: false };
    case 'issue': {
      const [repo, number] = link.target_id.split('#');
      return { href: `https://github.com/${repo}/issues/${number}`, external: true };
    }
    case 'repository':
      return { href: `https://github.com/${link.target_id.replace(/^@/, '')}`, external: true };
    case 'decision_alert':
      return { href: `/decision-alerts/${link.target_id}`, external: false };
    case 'claim':
      return { href: `/knowledge/claims?claim=${link.target_id}`, external: false };
    case 'zotero_collection':
      return { href: '/integrations', external: false };
  }
}

/** Renders an event summary, replacing `{link}` with a real link. */
export function AuditSummary({ event }: { event: Pick<AuditEvent, 'summary' | 'link'> }) {
  const [before, after = ''] = event.summary.split('{link}');
  if (!event.link || !event.summary.includes('{link}')) return <>{event.summary.replace('{link}', event.link?.label ?? '')}</>;
  const { href, external } = auditHref(event.link);
  return (
    <>
      {before}
      {external ? (
        <a href={href} target="_blank" rel="noreferrer" className="text-accent underline underline-offset-4 hover:text-fg">
          {event.link.label}
        </a>
      ) : (
        <Link to={href} className="text-accent underline underline-offset-4 hover:text-fg">
          {event.link.label}
        </Link>
      )}
      {after}
    </>
  );
}
