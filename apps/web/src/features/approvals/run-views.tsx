import { Link } from 'react-router';
import { Ban, Check, CircleCheck, Circle, ExternalLink, RotateCw, X } from 'lucide-react';
import type { ActionProposal } from '@contracts/types';
import { cn } from '@/lib/cn';
import { formatRelativeDay, formatTimeSeconds, formatTime } from '@/lib/format';
import { Button, ButtonLink } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';
import { MetaList } from '@/components/ui/primitives';
import { StatusBadge } from '@/components/common/status-badge';
import { InlineAlert } from '@/components/common/states';

function Title({ p, children }: { p: ActionProposal; children?: React.ReactNode }) {
  return (
    <div className="flex flex-wrap items-center gap-3">
      <h2 className="text-xl font-semibold text-fg">
        Create issue in <span className="font-mono text-lg">{p.target.repository}</span>
      </h2>
      {children}
    </div>
  );
}

/** Executing/verifying: no success message until the backend confirms (UI.md §4.10). */
export function ExecutingView({ proposal: p }: { proposal: ActionProposal }) {
  const run = p.latest_run;
  return (
    <div className="flex min-h-full flex-col">
      <div className="flex flex-col gap-8 px-4 py-6 md:px-10">
        <div>
          <Title p={p}>
            <StatusBadge status={p.status} size="md" />
          </Title>
          <p className="mt-2 text-sm text-fg-secondary">Approved by you · {p.decided_at ? `${formatRelativeDay(p.decided_at)} ${formatTime(p.decided_at)}` : ''} · GitHub · <span className="font-mono">{p.target.account}</span></p>
        </div>
        <div role="status" aria-live="polite" className="flex gap-4 rounded-card border border-subtle bg-surface p-6">
          <Spinner className="mt-1 size-6 text-accent" />
          <div>
            <p className="text-lg font-semibold text-fg">{p.status === 'verifying' ? 'Verifying the issue on GitHub…' : 'Creating the issue on GitHub…'}</p>
            <p className="mt-1 text-base text-fg-secondary">Waiting for GitHub to confirm. Success is shown only after ORIVANA has verified the issue exists with the approved content. You can leave this page; the result will also appear in Activity.</p>
          </div>
        </div>
        <section aria-labelledby="progress-title">
          <h3 id="progress-title" className="text-sm font-medium text-fg-secondary">Progress</h3>
          <ol className="mt-3 divide-y divide-subtle">
            {run?.steps.map((s) => (
              <li key={s.label} className={cn('flex items-center gap-4 py-3.5 text-base', s.state === 'pending' ? 'text-fg-muted' : 'text-fg', s.state === 'active' && 'font-semibold')}>
                {s.state === 'done' ? <Check aria-hidden="true" className="size-5 text-knowledge" /> : s.state === 'active' ? <Spinner className="size-5 text-accent" /> : s.state === 'failed' ? <X aria-hidden="true" className="size-5 text-danger" /> : <Circle aria-hidden="true" className="size-5" />}
                <span className="flex-1">{s.label}</span>
                {s.at ? <span className="text-sm font-normal text-fg-secondary tabular">{s.state === 'active' ? 'started ' : ''}{formatTimeSeconds(s.at)}</span> : null}
              </li>
            ))}
          </ol>
        </section>
        <MetaList className="rounded-card border border-subtle bg-surface p-5" labelWidth="w-36" rows={[['Title', p.arguments.title], ['Labels', p.arguments.labels.join(', ') || '—'], ['Idempotency key', <span className="font-mono text-sm">{p.idempotency_key}</span>]]} />
      </div>
      <div className="sticky bottom-0 mt-auto flex items-center gap-4 border-t border-subtle bg-app px-4 py-4 md:px-10">
        <p className="flex-1 text-sm text-fg-secondary">Approve, Edit and Reject are locked while the action runs.</p>
        <Button variant="primary" size="lg" loading loadingText="Executing…" />
      </div>
    </div>
  );
}

export function SucceededView({ proposal: p }: { proposal: ActionProposal }) {
  const run = p.latest_run!;
  return (
    <div className="flex flex-col gap-8 px-4 py-6 md:px-10">
      <div>
        <Title p={p}>
          <StatusBadge status="succeeded" size="md" />
          {run.verified_at ? <StatusBadge status="verified" size="md" /> : null}
        </Title>
        <p className="mt-2 text-sm text-fg-secondary">
          Approved by you {p.decided_at ? formatTimeSeconds(p.decided_at) : ''} · executed {run.executed_at ? formatTimeSeconds(run.executed_at) : '—'} · verified {run.verified_at ? formatTimeSeconds(run.verified_at) : '—'}
        </p>
      </div>
      <div role="status" className="flex gap-4 rounded-card border border-knowledge/50 bg-surface p-6">
        <CircleCheck aria-hidden="true" className="mt-0.5 size-6 shrink-0 text-knowledge" />
        <div>
          <p className="text-lg font-semibold text-fg">Issue {run.external_ref?.split('#')[1] ? `#${run.external_ref.split('#')[1]}` : ''} created in {p.target.repository}</p>
          <p className="mt-1 text-base text-fg-secondary">GitHub confirmed the issue, and ORIVANA checked that its title, body, and labels match what you approved.</p>
          <div className="mt-5 flex flex-wrap gap-3">
            {run.external_url ? (
              <a href={run.external_url} target="_blank" rel="noreferrer" className="inline-flex h-11 items-center gap-2 rounded-control bg-accent px-5 text-base font-medium text-on-accent hover:bg-accent/85">
                Open issue on GitHub
                <ExternalLink aria-hidden="true" className="size-4" />
              </a>
            ) : null}
            <ButtonLink to="/approvals" size="lg">Back to Approvals</ButtonLink>
          </div>
        </div>
      </div>
      <section aria-labelledby="verify-title">
        <h3 id="verify-title" className="text-sm font-medium text-fg-secondary">Verification result</h3>
        <ul className="mt-3 divide-y divide-subtle rounded-card border border-subtle bg-surface px-5">
          {run.verification.map((v) => (
            <li key={v.label} className="flex items-center gap-4 py-3.5 text-base text-fg">
              {v.passed ? <Check aria-hidden="true" className="size-5 text-knowledge" /> : <X aria-hidden="true" className="size-5 text-danger" />}
              <span className="flex-1">{v.label}<span className="sr-only">{v.passed ? ' (passed)' : ' (failed)'}</span></span>
              {v.detail ? <span className="font-mono text-xs text-fg-secondary">{v.detail}</span> : null}
            </li>
          ))}
        </ul>
      </section>
      <section aria-labelledby="linked-title">
        <h3 id="linked-title" className="text-sm font-medium text-fg-secondary">Linked back to</h3>
        <MetaList
          className="mt-3 rounded-card border border-subtle bg-surface p-5"
          labelWidth="w-32"
          rows={[
            ['Project', p.project_id ? <><Link to={`/projects/${p.project_id}/actions`} className="text-accent underline underline-offset-4">{p.project_name}</Link> · added to Actions</> : '—'],
            ['Evidence', p.citations.map((c) => `${c.source_title.split(':')[0]} p. ${c.page}`).join(' · ') || '—'],
            ['Conversation', p.conversation_id ? <Link to={`/assistant/${p.conversation_id}`} className="text-accent underline underline-offset-4">{p.conversation_title}</Link> : '—'],
            ['Audit event', run.audit_event_id ? <Link to={`/activity?q=${run.audit_event_id}`} className="font-mono text-sm text-accent underline underline-offset-4">{run.audit_event_id} · external_action.succeeded</Link> : '—'],
          ]}
        />
      </section>
    </div>
  );
}

export function RejectedView({ proposal: p }: { proposal: ActionProposal }) {
  const expired = p.status === 'expired';
  return (
    <div className="flex flex-col gap-8 px-4 py-6 md:px-10">
      <div>
        <Title p={p}>
          <StatusBadge status={p.status} size="md" />
        </Title>
        <p className="mt-2 text-sm text-fg-secondary">{expired ? 'Expired without a decision' : `Rejected by you · ${p.decided_at ? `${formatRelativeDay(p.decided_at)} ${formatTime(p.decided_at)}` : ''}`}</p>
      </div>
      <div className="flex gap-4 rounded-card border border-subtle bg-surface p-6">
        <Ban aria-hidden="true" className="mt-0.5 size-6 shrink-0 text-fg-secondary" />
        <div>
          <p className="text-lg font-semibold text-fg">Nothing was sent to GitHub</p>
          <p className="mt-1 text-base text-fg-secondary">The proposal moved to Decided{p.reject_reason ? ' with your reason' : ''}. The finding and its evidence remain in the conversation.</p>
        </div>
      </div>
      {p.reject_reason ? (
        <section aria-labelledby="reason-title">
          <h3 id="reason-title" className="text-sm font-medium text-fg-secondary">Reason</h3>
          <p className="mt-2 rounded-card border border-control bg-app p-4 text-base text-fg">{p.reject_reason}</p>
        </section>
      ) : null}
      <MetaList className="rounded-card border border-subtle bg-surface p-5" labelWidth="w-36" rows={[['Audit event', p.audit_event_id ? <Link to={`/activity?q=${p.audit_event_id}`} className="font-mono text-sm text-accent underline underline-offset-4">{p.audit_event_id} · action_proposal.rejected</Link> : '—'], ['Idempotency key', <span className="font-mono text-sm">{p.idempotency_key} · retired</span>]]} />
      <div className="flex justify-end gap-3">
        {p.conversation_id ? <ButtonLink to={`/assistant/${p.conversation_id}`} variant="ghost" size="lg">Open conversation</ButtonLink> : null}
        <ButtonLink to="/approvals" size="lg">Back to Approvals</ButtonLink>
      </div>
    </div>
  );
}

export function FailedView({ proposal: p }: { proposal: ActionProposal }) {
  return (
    <div className="flex flex-col gap-6 px-4 py-6 md:px-10">
      <Title p={p}>
        <StatusBadge status="failed" size="md" />
      </Title>
      <InlineAlert tone="danger" title="The issue was not created" live>
        {p.latest_run?.error_message ?? 'GitHub did not confirm the action.'}
      </InlineAlert>
      <Button className="self-start" disabled title="Retry is enabled once the duplicate check passes">
        <RotateCw aria-hidden="true" />
        Retry with the same idempotency key
      </Button>
    </div>
  );
}
