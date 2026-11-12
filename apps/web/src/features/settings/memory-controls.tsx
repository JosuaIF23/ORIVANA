import { useState } from 'react';
import { Link } from 'react-router';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { Preferences } from '@contracts/types';
import { deleteCandidateMemories } from '@/services/memories';
import { useMe } from '@/hooks/use-session';
import { qk } from '@/hooks/query-keys';
import { Button } from '@/components/ui/button';
import { SwitchRow } from '@/components/ui/controls';
import { Dialog } from '@/components/ui/dialog';
import { Select } from '@/components/ui/field';
import { LoadingSkeleton } from '@/components/common/states';
import { useToast } from '@/components/common/toast';
import { usePreferences, useUpdatePreferences } from '@/features/onboarding/use-onboarding';

export function MemoryControls() {
  const { data: prefs } = usePreferences();
  const { data: me } = useMe();
  const update = useUpdatePreferences();
  const toast = useToast();
  const qc = useQueryClient();
  const [clearing, setClearing] = useState(false);
  const review = me?.counts.memories_needing_review ?? 0;
  const clear = useMutation({
    mutationFn: deleteCandidateMemories,
    onSuccess: (r) => {
      void qc.invalidateQueries({ queryKey: qk.memoriesAll });
      void qc.invalidateQueries({ queryKey: qk.me });
      setClearing(false);
      toast.success(`Removed ${r.deleted} candidate ${r.deleted === 1 ? 'memory' : 'memories'}`);
    },
  });
  const save = (patch: Partial<Preferences>) => update.mutate(patch, { onError: (e) => toast.error(e.message) });

  if (!prefs) return <LoadingSkeleton className="mt-6" rows={4} />;
  return (
    <div className="mt-2">
      <p className="text-base text-fg-secondary">
        Decide what ORIVANA may remember and how unconfirmed suggestions are used.{' '}
        <Link to="/knowledge/memory" className="text-accent underline underline-offset-4 hover:text-fg">Review memories ({review} need review)</Link>
      </p>
      <div className="mt-6 divide-y divide-subtle">
        <div className="py-5"><SwitchRow id="s-conv" label="Suggest memories from conversations" description="Decisions, facts, and preferences you state while chatting become candidates." checked={prefs.suggest_memories_from_conversations} onCheckedChange={(v) => save({ suggest_memories_from_conversations: v })} /></div>
        <div className="py-5"><SwitchRow id="s-src" label="Suggest memories from uploaded sources" description="Facts extracted from papers, always linked to the passage they came from." checked={prefs.suggest_memories_from_sources} onCheckedChange={(v) => save({ suggest_memories_from_sources: v })} /></div>
        <div className="py-5"><SwitchRow id="s-cand" label="Use unconfirmed candidates in answers" description="Off: answers rely only on confirmed memories and source passages." checked={prefs.use_unconfirmed_candidates_in_answers} onCheckedChange={(v) => save({ use_unconfirmed_candidates_in_answers: v })} /></div>
        <div className="flex flex-wrap items-center justify-between gap-4 py-5">
          <div>
            <label htmlFor="s-discard" className="text-sm font-medium text-fg">Discard unreviewed candidates after</label>
            <p className="mt-0.5 text-xs text-fg-secondary">Confirmed memories are never discarded automatically.</p>
          </div>
          <Select id="s-discard" className="w-56" value={String(prefs.discard_unreviewed_candidates_after_days ?? 'never')} onChange={(e) => save({ discard_unreviewed_candidates_after_days: e.target.value === 'never' ? null : (Number(e.target.value) as 7 | 30 | 90) })}>
            <option value="7">7 days</option>
            <option value="30">30 days</option>
            <option value="90">90 days</option>
            <option value="never">Never</option>
          </Select>
        </div>
        <div className="flex flex-wrap items-center justify-between gap-4 py-5">
          <p className="text-sm text-fg-secondary">Removes {review} candidate {review === 1 ? 'memory' : 'memories'}. Confirmed memories are kept.</p>
          <Button variant="ghost" className="text-danger hover:text-danger" disabled={review === 0} onClick={() => setClearing(true)}>Clear all candidates…</Button>
        </div>
      </div>
      <Dialog
        open={clearing}
        onOpenChange={setClearing}
        title="Clear all candidate memories?"
        description={`This removes ${review} unreviewed ${review === 1 ? 'suggestion' : 'suggestions'}. Confirmed memories and decisions are not affected. This can’t be undone.`}
        footer={<><Button onClick={() => setClearing(false)}>Cancel</Button><Button variant="danger-solid" loading={clear.isPending} loadingText="Clearing…" onClick={() => clear.mutate()}>Clear candidates</Button></>}
      />
    </div>
  );
}
