import { useEffect, useRef, useState } from 'react';
import { Link, useBlocker, useNavigate } from 'react-router';
import type { ActionProposal, CreateIssueArguments } from '@contracts/types';
import { Button } from '@/components/ui/button';
import { Dialog } from '@/components/ui/dialog';
import { Field, Input, Select, Textarea } from '@/components/ui/field';
import { InlineAlert } from '@/components/common/states';
import { StatusBadge } from '@/components/common/status-badge';
import { useToast } from '@/components/common/toast';
import { LabelEditor } from './label-editor';
import { useDiscardEditing, useRepositories, useUpdateProposal } from './use-approvals';

/** Edit (Draft): changes return the proposal to Draft; approval unlocks after re-validation. */
export function ProposalEditor({ proposal: p }: { proposal: ActionProposal }) {
  const navigate = useNavigate();
  const toast = useToast();
  const { data: repos = [] } = useRepositories();
  const update = useUpdateProposal();
  const discard = useDiscardEditing();
  const [args, setArgs] = useState<CreateIssueArguments>(p.arguments);
  const dirty = JSON.stringify(args) !== JSON.stringify(p.arguments);
  const repo = repos.find((r) => r.full_name === args.repository);
  const unknownLabels = repo ? args.labels.filter((l) => !repo.labels.includes(l)) : [];
  const leaving = useRef(false);
  const blocker = useBlocker(({ currentLocation, nextLocation }) => dirty && !leaving.current && currentLocation.pathname !== nextLocation.pathname);

  useEffect(() => {
    if (!dirty) return;
    const warn = (e: BeforeUnloadEvent) => e.preventDefault();
    window.addEventListener('beforeunload', warn);
    return () => window.removeEventListener('beforeunload', warn);
  }, [dirty]);

  const set = <K extends keyof CreateIssueArguments>(key: K, value: CreateIssueArguments[K]) => setArgs((a) => ({ ...a, [key]: value }));
  const validated = p.status === 'awaiting_approval' && !dirty;

  function save() {
    update.mutate(
      { id: p.id, args, revision: p.revision },
      {
        onSuccess: (res) => {
          if (res.status === 'awaiting_approval') {
            leaving.current = true;
            toast.success('Saved and validated — ready for approval');
            navigate(`/approvals/${p.id}`);
          }
        },
      },
    );
  }

  return (
    <div className="flex min-h-full flex-col">
      <div className="flex flex-col gap-6 px-4 py-6 md:px-10">
        <Link to={`/approvals/${p.id}`} className="self-start text-sm text-accent underline underline-offset-4 hover:text-fg">
          ← Back to review
        </Link>
        <div className="flex flex-wrap items-center gap-3">
          <h2 className="text-xl font-semibold text-fg">Edit proposal · Create issue</h2>
          <StatusBadge status="draft" size="md" />
        </div>
        <InlineAlert tone="info" title="This proposal is back in Draft.">
          When you save, ORIVANA re-validates the repository, your permissions, and the content. You can approve it only after validation passes.
        </InlineAlert>
        {p.validation.status === 'failed' && !dirty ? (
          <InlineAlert tone="warning" title="Validation failed" live>
            {p.validation.issues.map((i) => i.message).join(' ')}
          </InlineAlert>
        ) : null}
        {update.error ? <InlineAlert tone="danger" title="Not saved" live>{update.error.message}</InlineAlert> : null}
        <Field label="Repository" hint="Only repositories you granted in Integrations are listed.">
          {({ id, describedBy }) => (
            <Select id={id} value={args.repository} onChange={(e) => set('repository', e.target.value)} aria-describedby={describedBy}>
              {repos.map((r) => (
                <option key={r.full_name} value={r.full_name}>
                  {r.full_name} ({r.visibility})
                </option>
              ))}
            </Select>
          )}
        </Field>
        <Field label={<>Title <span className="text-danger" aria-hidden="true">*</span></>} error={!args.title.trim() ? 'Add a title.' : null}>
          {({ id, describedBy, invalid }) => <Input id={id} name="issue-title" autoComplete="off" required value={args.title} onChange={(e) => set('title', e.target.value)} aria-describedby={describedBy} aria-invalid={invalid} />}
        </Field>
        <Field label="Body · Markdown" action={<span className="text-sm text-fg-secondary tabular">{args.body.length.toLocaleString('en-US')} / 65,536</span>} hint="Citations to your sources stay linked to this proposal.">
          {({ id, describedBy }) => <Textarea id={id} name="issue-body" autoComplete="off" spellCheck rows={12} className="font-mono text-sm leading-6" value={args.body} onChange={(e) => set('body', e.target.value)} aria-describedby={describedBy} maxLength={65536} />}
        </Field>
        <LabelEditor labels={args.labels} unknown={unknownLabels} repository={args.repository} onChange={(labels) => set('labels', labels)} />
        {p.changes_since_proposal.length ? (
          <div className="rounded-card border border-subtle bg-surface p-5 text-base">
            <p className="text-fg">
              <strong className="font-semibold">Changed since the agent’s proposal:</strong> {p.changes_since_proposal.join(', ')}.
            </p>
            <p className="mt-1 text-fg-secondary">
              Previous version is kept in the audit log · <span className="font-mono text-sm">{p.idempotency_key} · rev {p.revision}</span>
            </p>
          </div>
        ) : null}
      </div>
      <div className="sticky bottom-0 mt-auto flex flex-wrap items-center gap-4 border-t border-subtle bg-app px-4 py-4 md:px-10">
        <Button variant="ghost" size="lg" onClick={() => discard.mutate(p.id, { onSuccess: () => { leaving.current = true; navigate(`/approvals/${p.id}`); } })}>
          Discard changes…
        </Button>
        <p className="min-w-0 flex-1 text-sm text-fg-secondary">{validated ? 'Validation passed.' : 'Approve unlocks after validation.'}</p>
        <Button size="lg" disabled={!validated} onClick={() => navigate(`/approvals/${p.id}`)}>
          Approve
        </Button>
        <Button variant="primary" size="lg" onClick={save} loading={update.isPending} loadingText="Validating…" disabled={!args.title.trim()}>
          Save &amp; re-validate
        </Button>
      </div>
      <Dialog
        open={blocker.state === 'blocked'}
        onOpenChange={(open) => !open && blocker.reset?.()}
        title="Leave without saving?"
        description="Your edits to this proposal are not saved. The proposal stays in Draft."
        footer={
          <>
            <Button onClick={() => blocker.reset?.()}>Keep editing</Button>
            <Button variant="danger-solid" onClick={() => blocker.proceed?.()}>
              Leave
            </Button>
          </>
        }
      />
    </div>
  );
}
