import { useState } from 'react';
import type { Memory } from '@contracts/types';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/controls';
import { Dialog } from '@/components/ui/dialog';
import { useToast } from '@/components/common/toast';
import { useClaims } from '@/features/claims/use-claims';
import { useSetDependencies } from './use-decisions';

/** PUT /memories/{id}/dependencies — choose the claims a decision relies on. */
export function DependenciesDialog({ decision, open, onOpenChange }: { decision: Memory; open: boolean; onOpenChange: (open: boolean) => void }) {
  const { data } = useClaims({ project_id: decision.project_id ?? undefined, sort: 'used_by_decisions' });
  const save = useSetDependencies();
  const toast = useToast();
  const [chosen, setChosen] = useState<Set<string>>(() => new Set(decision.dependencies?.map((d) => d.claim_id) ?? []));
  const toggle = (id: string, on: boolean) =>
    setChosen((prev) => {
      const next = new Set(prev);
      if (on) next.add(id);
      else next.delete(id);
      return next;
    });

  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
      title="Claims this decision depends on"
      description="ORIVANA flags the decision for review when new evidence contradicts one of these claims."
      footer={
        <>
          <Button onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button
            variant="primary"
            loading={save.isPending}
            loadingText="Saving…"
            onClick={() =>
              save.mutate({ id: decision.id, claimIds: [...chosen] }, { onSuccess: () => { onOpenChange(false); toast.success('Dependencies saved'); }, onError: (e) => toast.error(e.message) })
            }
          >
            Save dependencies
          </Button>
        </>
      }
    >
      <ul className="flex flex-col gap-2">
        {(data?.items ?? []).map((c) => (
          <li key={c.id}>
            <label className="flex cursor-pointer items-start gap-3 rounded-control border border-subtle p-3 has-[[data-state=checked]]:border-accent">
              <Checkbox checked={chosen.has(c.id)} onCheckedChange={(v) => toggle(c.id, v)} className="mt-0.5" />
              <span className="text-sm text-fg">
                {c.statement}
                <span className="mt-1 block text-xs text-fg-secondary">
                  {c.supports_count} supports · {c.contradicts_count} contradicts · {c.status === 'candidate' ? 'Candidate' : 'Confirmed'}
                </span>
              </span>
            </label>
          </li>
        ))}
      </ul>
    </Dialog>
  );
}
