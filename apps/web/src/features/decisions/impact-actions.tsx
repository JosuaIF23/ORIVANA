import { useState } from 'react';
import type { DecisionAlert } from '@contracts/types';
import { Button } from '@/components/ui/button';
import { Dialog } from '@/components/ui/dialog';
import { Field, Input, Textarea } from '@/components/ui/field';
import { Sheet } from '@/components/ui/sheet';
import { useToast } from '@/components/common/toast';
import { useCreateMemory } from '@/features/memory/use-memory';
import { useDecision, useUpdateDecisionAlert } from './use-decisions';

/** Keep decision: dismiss the alert with a short note (stored in history). */
export function KeepDecisionDialog({ alert, open, onOpenChange }: { alert: DecisionAlert; open: boolean; onOpenChange: (open: boolean) => void }) {
  const [note, setNote] = useState('');
  const update = useUpdateDecisionAlert();
  const toast = useToast();
  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
      title="Keep this decision?"
      description="The alert closes and your note is saved in the decision’s history. The contradicting evidence stays visible in Claims."
      footer={
        <>
          <Button onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button
            variant="primary"
            disabled={!note.trim()}
            loading={update.isPending}
            loadingText="Saving…"
            onClick={() => update.mutate({ id: alert.id, request: { status: 'dismissed', resolution_note: note } }, { onSuccess: () => { onOpenChange(false); toast.success('Decision kept · note saved'); } })}
          >
            Keep decision
          </Button>
        </>
      }
    >
      <Field label="Why does the decision still hold?" hint="Required. For example: multi-hop questions are out of scope for this chapter." error={update.error?.message}>
        {({ id, describedBy, invalid }) => <Textarea id={id} name="resolution_note" autoComplete="off" value={note} onChange={(e) => setNote(e.target.value)} aria-describedby={describedBy} aria-invalid={invalid} placeholder="Multi-hop is out of scope for Chapter 4…" />}
      </Field>
    </Dialog>
  );
}

/** Revise decision: a new decision supersedes the old one, then the alert is resolved. */
export function ReviseDecisionSheet({ alert, open, onOpenChange, onDone }: { alert: DecisionAlert; open: boolean; onOpenChange: (open: boolean) => void; onDone: (newId: string) => void }) {
  const { data: decision } = useDecision(open ? alert.memory_id : null);
  const create = useCreateMemory();
  const resolve = useUpdateDecisionAlert();
  const toast = useToast();
  const [title, setTitle] = useState(alert.decision_title);
  const [statement, setStatement] = useState(alert.decision_statement);
  const [rationale, setRationale] = useState(alert.decision_rationale ?? '');
  const pending = create.isPending || resolve.isPending;
  const error = create.error ?? resolve.error;

  function save() {
    create.mutate(
      {
        kind: 'decision',
        memory_type: 'project',
        project_id: alert.project_id,
        title,
        content: statement,
        rationale,
        status: 'confirmed',
        supersedes_id: alert.memory_id,
        dependencies: decision?.dependencies?.map((d) => d.claim_id) ?? [alert.claim_id],
        evidence: decision?.decision?.evidence ?? [],
      },
      {
        onSuccess: (created) =>
          resolve.mutate(
            { id: alert.id, request: { status: 'resolved', replacement_memory_id: created.id, resolution_note: `Revised as ${created.decision?.code ?? 'a new decision'}` } },
            {
              onSuccess: () => {
                toast.success(`Decision revised as ${created.decision?.code ?? 'a new decision'}`);
                onOpenChange(false);
                onDone(created.id);
              },
            },
          ),
      },
    );
  }

  return (
    <Sheet
      open={open}
      onOpenChange={onOpenChange}
      title="Revise decision"
      description={`Saving creates a new decision that supersedes ${alert.decision_code ?? 'the current one'}. The old one stays in history, struck through.`}
      footer={
        <>
          <Button onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button variant="primary" onClick={save} loading={pending} loadingText="Saving…" disabled={!title.trim() || !statement.trim()}>
            Save revised decision
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-4">
        <Field label="Title">{({ id }) => <Input id={id} name="title" autoComplete="off" value={title} onChange={(e) => setTitle(e.target.value)} />}</Field>
        <Field label="Statement">{({ id }) => <Textarea id={id} name="statement" autoComplete="off" value={statement} onChange={(e) => setStatement(e.target.value)} />}</Field>
        <Field label="Rationale" hint="Say how the new evidence changed the decision." error={error?.message}>
          {({ id, describedBy, invalid }) => <Textarea id={id} name="rationale" autoComplete="off" value={rationale} onChange={(e) => setRationale(e.target.value)} aria-describedby={describedBy} aria-invalid={invalid} />}
        </Field>
        <p className="text-sm text-fg-secondary">
          Keeps {decision?.dependencies?.length ?? 1} claim dependenc{(decision?.dependencies?.length ?? 1) === 1 ? 'y' : 'ies'} and the existing evidence. You can change them after saving.
        </p>
      </div>
    </Sheet>
  );
}
