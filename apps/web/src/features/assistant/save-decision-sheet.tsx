import { useState } from 'react';
import { Link } from 'react-router';
import type { Claim, Message } from '@contracts/types';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/controls';
import { Field, Input, Textarea } from '@/components/ui/field';
import { Sheet } from '@/components/ui/sheet';
import { useToast } from '@/components/common/toast';
import { useClaims } from '@/features/claims/use-claims';
import { useCreateMemory } from '@/features/memory/use-memory';

/** Plain first sentence of a Markdown answer, without citation markers. */
function summarize(content: string): string {
  const plain = content.replace(/\[\d+\]/g, '').replace(/[*_`#>]/g, '').replace(/\s+/g, ' ').trim();
  const first = plain.split(/(?<=[.:])\s/)[0] ?? plain;
  return first.replace(/:$/, '.').slice(0, 280);
}

/** Claims whose statement mentions one of the answer's related entities (suggested dependencies). */
function suggestedClaims(message: Message, claims: Claim[]): string[] {
  const names = message.related_entities.map((e) => e.name.toLowerCase().split(' ')[0]);
  const ids = new Set(message.related_entities.map((e) => e.id));
  return claims.filter((c) => ids.has(c.id) || names.some((n) => n.length > 3 && c.statement.toLowerCase().includes(n))).map((c) => c.id).slice(0, 2);
}

interface Props {
  message: Message;
  projectId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

/** Save as decision (UI.md §4.5): statement from the answer, citations as evidence, suggested claims. */
export function SaveAsDecisionSheet({ message, projectId, open, onOpenChange }: Props) {
  const { data } = useClaims({ project_id: projectId ?? undefined, sort: 'used_by_decisions' });
  const create = useCreateMemory();
  const toast = useToast();
  const claims = data?.items ?? [];
  const [title, setTitle] = useState('');
  const [statement, setStatement] = useState(() => summarize(message.content));
  const [rationale, setRationale] = useState('');
  const [picked, setPicked] = useState<Set<string> | null>(null);
  const chosen = picked ?? new Set(suggestedClaims(message, claims));
  const evidence = [...new Map(message.citations.map((c) => [`${c.source_id}-${c.page}`, { source_id: c.source_id, label: c.source_label, page: c.page }])).values()];
  const toggle = (id: string, on: boolean) => {
    const next = new Set(chosen);
    if (on) next.add(id);
    else next.delete(id);
    setPicked(next);
  };

  function save(status: 'proposed' | 'confirmed') {
    create.mutate(
      { kind: 'decision', memory_type: 'project', project_id: projectId, title: title.trim(), content: statement, rationale, status, dependencies: [...chosen], evidence, from_message_id: message.id },
      {
        onSuccess: (d) => {
          onOpenChange(false);
          toast.success(`${d.decision?.code ?? 'Decision'} saved as ${status}`);
        },
      },
    );
  }

  return (
    <Sheet
      open={open}
      onOpenChange={onOpenChange}
      title="Save as decision"
      description="Prefilled from this answer. Edit it before saving; nothing is final until you confirm."
      footer={
        <>
          <Button onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={() => save('proposed')} disabled={!title.trim() || create.isPending} loading={create.isPending && create.variables?.status === 'proposed'} loadingText="Saving…">
            Save as Proposed
          </Button>
          <Button variant="primary" onClick={() => save('confirmed')} disabled={!title.trim() || create.isPending} loading={create.isPending && create.variables?.status === 'confirmed'} loadingText="Saving…">
            Save as Confirmed
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-5">
        <Field label="Decision title" hint="Short, e.g. “Use hybrid retrieval for thesis experiments”.">
          {({ id, describedBy }) => <Input id={id} name="title" autoComplete="off" value={title} onChange={(e) => setTitle(e.target.value)} aria-describedby={describedBy} placeholder="Use hybrid retrieval for…" />}
        </Field>
        <Field label="Statement">{({ id }) => <Textarea id={id} name="statement" autoComplete="off" value={statement} onChange={(e) => setStatement(e.target.value)} />}</Field>
        <Field label="Rationale" hint="Why you decided this. Shown when the decision is reviewed later." error={create.error?.message}>
          {({ id, describedBy, invalid }) => <Textarea id={id} name="rationale" autoComplete="off" value={rationale} onChange={(e) => setRationale(e.target.value)} aria-describedby={describedBy} aria-invalid={invalid} />}
        </Field>
        <section aria-labelledby="save-evidence">
          <h3 id="save-evidence" className="text-sm font-medium text-fg-secondary">Evidence from the citations · {evidence.length}</h3>
          <ul className="mt-2 flex flex-wrap gap-2">
            {evidence.map((e) => (
              <li key={`${e.source_id}-${e.page}`} className="rounded-full border border-control px-3 py-1 text-sm text-fg">
                {e.label} · p. {e.page}
              </li>
            ))}
          </ul>
        </section>
        <fieldset>
          <legend className="text-sm font-medium text-fg-secondary">Depends on these claims</legend>
          <p className="mt-1 text-xs text-fg-muted">ORIVANA flags the decision when new evidence contradicts one of them. Suggested claims are preselected.</p>
          <ul className="mt-3 flex flex-col gap-2">
            {claims.map((c) => (
              <li key={c.id}>
                <label className="flex cursor-pointer items-start gap-3 rounded-control border border-subtle p-3 has-[[data-state=checked]]:border-accent">
                  <Checkbox checked={chosen.has(c.id)} onCheckedChange={(v) => toggle(c.id, v)} className="mt-0.5" />
                  <span className="text-sm text-fg">{c.statement}</span>
                </label>
              </li>
            ))}
          </ul>
          {claims.length === 0 ? (
            <p className="mt-2 text-sm text-fg-muted">
              No claims yet. You can link claims later in <Link to="/knowledge/memory" className="text-accent underline underline-offset-4">Memory</Link>.
            </p>
          ) : null}
        </fieldset>
      </div>
    </Sheet>
  );
}
