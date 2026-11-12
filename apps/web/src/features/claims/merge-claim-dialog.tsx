import { useId, useState } from 'react';
import { useNavigate } from 'react-router';
import type { ClaimDetail } from '@contracts/types';
import { Button } from '@/components/ui/button';
import { Dialog } from '@/components/ui/dialog';
import { useToast } from '@/components/common/toast';
import { useClaims, useUpdateClaim } from './use-claims';

/** Merge similar claims with user confirmation (PRD §8.4: "normalized … with user confirmation"). */
export function MergeClaimDialog({ claim, open, onOpenChange }: { claim: ClaimDetail; open: boolean; onOpenChange: (open: boolean) => void }) {
  const { data } = useClaims({ project_id: claim.project_id ?? undefined });
  const update = useUpdateClaim();
  const toast = useToast();
  const navigate = useNavigate();
  const name = useId();
  const suggested = new Set(claim.merge_suggestions.map((m) => m.id));
  const options = (data?.items ?? []).filter((c) => c.id !== claim.id).toSorted((a, b) => Number(suggested.has(b.id)) - Number(suggested.has(a.id)));
  const [target, setTarget] = useState<string | null>(null);
  const chosen = target ?? options[0]?.id ?? null;

  function merge() {
    if (!chosen) return;
    update.mutate(
      { id: claim.id, request: { op: 'merge', into_claim_id: chosen } },
      {
        onSuccess: (merged) => {
          toast.success('Claims merged');
          onOpenChange(false);
          navigate(`/knowledge/claims?claim=${merged.id}`, { replace: true });
        },
        onError: (e) => toast.error(e.message),
      },
    );
  }

  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
      title="Merge with another claim"
      description="The evidence from this claim moves to the claim you choose. This claim is then removed from the list."
      footer={
        <>
          <Button onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button variant="primary" onClick={merge} disabled={!chosen} loading={update.isPending} loadingText="Merging…">
            Merge claims
          </Button>
        </>
      }
    >
      <p className="text-sm text-fg-secondary">
        Merging: <span className="text-fg">{claim.statement}</span>
      </p>
      <fieldset className="mt-4 flex flex-col gap-2">
        <legend className="mb-2 text-sm font-medium text-fg-secondary">Merge into</legend>
        {options.map((c) => (
          <label key={c.id} className="flex cursor-pointer items-start gap-3 rounded-control border border-subtle p-3 has-[:checked]:border-accent">
            <input type="radio" name={name} value={c.id} checked={chosen === c.id} onChange={() => setTarget(c.id)} className="mt-1 accent-accent" />
            <span className="text-sm text-fg">
              {c.statement}
              {suggested.has(c.id) ? <span className="ml-2 text-xs text-accent">Suggested</span> : null}
            </span>
          </label>
        ))}
      </fieldset>
    </Dialog>
  );
}
