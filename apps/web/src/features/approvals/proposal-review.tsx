import { useState } from 'react';
import { useNavigate } from 'react-router';
import { Check, Pencil, X } from 'lucide-react';
import type { ActionProposal } from '@contracts/types';
import { formatDate, formatRelativeDay, formatTime } from '@/lib/format';
import { Button } from '@/components/ui/button';
import { InlineAlert } from '@/components/common/states';
import { StatusBadge } from '@/components/common/status-badge';
import { useToast } from '@/components/common/toast';
import { RejectDialog } from './reject-dialog';
import { EvidenceUsed, FactsGrid, IssuePreview, RawFields, SideEffects } from './review-sections';
import { useApprove, useStartEditing } from './use-approvals';
import { ProposalOrigin } from './proposal-origin';

/** Review view: request, target, scope, exact content, evidence, side effects (UI.md §4.10). */
export function ProposalReview({ proposal: p }: { proposal: ActionProposal }) {
  const navigate = useNavigate();
  const approve = useApprove();
  const startEditing = useStartEditing();
  const toast = useToast();
  const [rejecting, setRejecting] = useState(false);
  const draft = p.status === 'draft';
  const fromAlert = p.origin?.type === 'decision_alert';

  return (
    <div className="flex min-h-full flex-col">
      <div className="flex flex-col gap-8 px-4 py-6 md:px-10">
        <header>
          <div className="flex flex-wrap items-center gap-3">
            <h2 className="text-xl font-semibold text-fg">
              Create issue in <span className="font-mono text-lg">{p.target.repository}</span>
            </h2>
            <StatusBadge status={p.status} size="md" />
          </div>
          <p className="mt-2 text-sm text-fg-secondary">
            Proposed by ORIVANA · {formatRelativeDay(p.created_at)} {formatTime(p.created_at)} · expires {formatDate(p.expires_at)}
          </p>
          <p className="mt-2 text-sm">
            <ProposalOrigin proposal={p} />
          </p>
        </header>
        {draft ? (
          <InlineAlert tone={p.validation.status === 'failed' ? 'warning' : 'info'} title="This proposal is in Draft">
            {p.validation.status === 'failed' ? p.validation.issues.map((i) => i.message).join(' ') : 'Finish editing and save to re-validate before you can approve it.'}
          </InlineAlert>
        ) : null}
        <FactsGrid proposal={p} />
        <section aria-labelledby="original-request">
          <h3 id="original-request" className="text-sm font-medium text-fg-secondary">{fromAlert ? 'Alert that led to this proposal' : 'Your original request'}</h3>
          <blockquote className="mt-3 rounded-card border border-subtle bg-surface p-5">
            <p className="text-base text-fg">“{p.original_request.text}”</p>
            <footer className="mt-2 text-sm text-fg-secondary">{fromAlert ? 'Decision Impact' : 'You'} · {formatRelativeDay(p.original_request.at)} {formatTime(p.original_request.at)}</footer>
          </blockquote>
        </section>
        <IssuePreview args={p.arguments} />
        <RawFields proposal={p} />
        <EvidenceUsed proposal={p} />
        <SideEffects proposal={p} />
      </div>
      <div className="sticky bottom-0 mt-auto flex flex-wrap items-center gap-4 border-t border-subtle bg-app px-4 py-4 md:px-10">
        <Button variant="danger" size="lg" onClick={() => setRejecting(true)}>
          <X aria-hidden="true" />
          Reject
        </Button>
        <p className="min-w-0 flex-1 text-sm text-fg-secondary">Nothing is sent to GitHub until you approve. Editing returns the proposal to Draft for re-validation.</p>
        <Button size="lg" loading={startEditing.isPending} onClick={() => startEditing.mutate(p.id, { onSuccess: () => navigate(`/approvals/${p.id}/edit`) })}>
          <Pencil aria-hidden="true" />
          Edit
        </Button>
        <Button
          variant="primary"
          size="lg"
          disabled={draft}
          loading={approve.isPending}
          loadingText="Approving…"
          onClick={() => approve.mutate(p.id, { onError: (e) => toast.error(e.message) })}
        >
          <Check aria-hidden="true" />
          Approve &amp; create issue
        </Button>
      </div>
      <RejectDialog proposal={p} open={rejecting} onOpenChange={setRejecting} />
    </div>
  );
}
