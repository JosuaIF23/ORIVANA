import { useState } from 'react';
import type { ActionProposal } from '@contracts/types';
import { Button } from '@/components/ui/button';
import { Dialog } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/field';
import { useReject } from './use-approvals';

/** Confirms a rejection and records an optional reason. */
export function RejectDialog({ proposal, open, onOpenChange, onRejected }: { proposal: ActionProposal; open: boolean; onOpenChange: (open: boolean) => void; onRejected?: () => void }) {
  const reject = useReject();
  const [reason, setReason] = useState('');
  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
      title="Reject this proposal?"
      description={`Nothing will be sent to GitHub. “${proposal.arguments.title}” moves to Decided with your reason.`}
      footer={
        <>
          <Button onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button
            variant="danger-solid"
            loading={reject.isPending}
            loadingText="Rejecting…"
            onClick={() =>
              reject.mutate(
                { id: proposal.id, reason },
                {
                  onSuccess: () => {
                    onOpenChange(false);
                    onRejected?.();
                  },
                },
              )
            }
          >
            Reject proposal
          </Button>
        </>
      }
    >
      <label htmlFor={`reject-${proposal.id}`} className="text-sm font-medium text-fg-secondary">
        Reason (optional, helps future proposals)
      </label>
      <Textarea id={`reject-${proposal.id}`} name="reason" autoComplete="off" className="mt-2" value={reason} onChange={(e) => setReason(e.target.value)} placeholder="e.g. Wait until the HotpotQA split is added…" />
      {reject.error ? <p role="alert" className="mt-2 text-sm text-danger">{reject.error.message}</p> : null}
    </Dialog>
  );
}
