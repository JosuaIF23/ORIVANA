import { useId, useState } from 'react';
import { Link } from 'react-router';
import { ChevronDown, Cpu, Plug, Server, User } from 'lucide-react';
import type { AuditEvent } from '@contracts/types';
import { cn } from '@/lib/cn';
import { formatTime } from '@/lib/format';
import { Button, ButtonLink } from '@/components/ui/button';
import { AuditSummary, auditHref } from '@/components/common/audit-summary';
import { StatusBadge } from '@/components/common/status-badge';
import { useToast } from '@/components/common/toast';
import { ACTOR_LABEL } from '@/lib/labels';
import { CATEGORY } from './category-chips';

const ACTOR: Record<AuditEvent['actor_type'], { label: string; icon: React.ReactNode }> = {
  user: { label: ACTOR_LABEL.user, icon: <User /> },
  agent: { label: ACTOR_LABEL.agent, icon: <Cpu /> },
  system: { label: ACTOR_LABEL.system, icon: <Server /> },
  external_client: { label: ACTOR_LABEL.external_client, icon: <Plug /> },
};

/** One audit event with expandable details (error code, job, request id). */
export function ActivityRow({ event: e, defaultOpen }: { event: AuditEvent; defaultOpen: boolean }) {
  const [open, setOpen] = useState(defaultOpen);
  const toast = useToast();
  const detailsId = useId();
  const failed = e.result === 'failed';
  const related = e.metadata.related;

  async function copy() {
    const text = JSON.stringify({ id: e.id, request_id: e.request_id, ...e.metadata }, null, 2);
    try {
      await navigator.clipboard.writeText(text);
      toast.success('Event details copied');
    } catch {
      toast.error('Copy failed');
    }
  }

  return (
    <li className={cn('border-b border-subtle', failed && open && 'bg-danger/5')}>
      <div className="grid grid-cols-[56px_minmax(0,1fr)_auto] items-center gap-x-4 gap-y-2 px-2 py-4 md:grid-cols-[56px_130px_160px_minmax(0,1fr)_auto_40px]">
        <time dateTime={e.created_at} className="text-base text-fg-secondary tabular">{formatTime(e.created_at)}</time>
        <span className="hidden h-8 w-fit items-center gap-2 rounded-control border border-subtle bg-surface px-3 text-sm text-fg-secondary md:inline-flex [&_svg]:size-4">
          {ACTOR[e.actor_type].icon}
          {ACTOR[e.actor_type].label}
        </span>
        <span className="hidden items-center gap-2 text-base text-fg-secondary md:flex [&_svg]:size-4">
          <span aria-hidden="true">{CATEGORY[e.category].icon}</span>
          {CATEGORY[e.category].label}
        </span>
        <p className="min-w-0 text-base text-fg">
          <span className="sr-only">{ACTOR[e.actor_type].label}, {CATEGORY[e.category].label}: </span>
          <AuditSummary event={e} />
        </p>
        <StatusBadge status={e.result} />
        <button
          type="button"
          aria-expanded={open}
          aria-controls={detailsId}
          aria-label={open ? 'Hide event details' : 'Show event details'}
          onClick={() => setOpen((v) => !v)}
          className="hidden size-9 items-center justify-center rounded-control text-fg-secondary hover:bg-elevated hover:text-fg md:flex"
        >
          <ChevronDown aria-hidden="true" className={cn('size-5 transition-transform', open && 'rotate-180')} />
        </button>
      </div>
      {open ? (
        <div id={detailsId} className="pb-5 md:pl-[262px]">
          <dl className={cn('grid gap-3 rounded-card border p-5 text-sm md:grid-cols-[120px_minmax(0,1fr)]', failed ? 'border-danger/50' : 'border-subtle')}>
            {e.metadata.error_code ? (<><dt className="text-fg-secondary">Error</dt><dd className="font-mono text-danger">{e.metadata.error_code}</dd></>) : null}
            {e.metadata.error_message ? (<><dt className="text-fg-secondary">Message</dt><dd className="text-fg">{e.metadata.error_message}</dd></>) : null}
            {e.metadata.job ? (<><dt className="text-fg-secondary">Job</dt><dd className="font-mono text-fg">{e.metadata.job}</dd></>) : null}
            <dt className="text-fg-secondary">Event</dt>
            <dd className="font-mono text-fg">{e.id} · {e.event_type}</dd>
            <dt className="text-fg-secondary">Request ID</dt>
            <dd className="font-mono text-fg">{e.request_id}</dd>
            {related ? (<><dt className="text-fg-secondary">Related</dt><dd className="text-fg"><Link to={auditHref(related).href} className="text-accent underline underline-offset-4">{related.label}</Link>{related.project_name ? ` · ${related.project_name}` : ''}</dd></>) : null}
          </dl>
          <div className="mt-4 flex gap-3">
            {failed && e.target_type === 'source' ? <ButtonLink to={`/knowledge/sources?status=failed`}>Fix in Sources</ButtonLink> : null}
            <Button variant="ghost" onClick={copy}>Copy details</Button>
          </div>
        </div>
      ) : null}
    </li>
  );
}
