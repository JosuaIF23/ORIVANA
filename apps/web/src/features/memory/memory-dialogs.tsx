import { useState } from 'react';
import type { Memory, MemoryType } from '@contracts/types';
import { useProjectsList } from '@/hooks/use-data';
import { Button } from '@/components/ui/button';
import { Dialog } from '@/components/ui/dialog';
import { Field, Select, Textarea } from '@/components/ui/field';
import { useToast } from '@/components/common/toast';
import { useCreateMemory, useDeleteMemory, useMemories, useUpdateMemory } from './use-memory';

/** Add (no `memory`) or edit a memory. */
export function MemoryFormDialog({ memory, open, onOpenChange }: { memory?: Memory; open: boolean; onOpenChange: (open: boolean) => void }) {
  const { data: projects = [] } = useProjectsList();
  const create = useCreateMemory();
  const update = useUpdateMemory();
  const toast = useToast();
  const isDecision = memory?.kind === 'decision';
  const [content, setContent] = useState((isDecision ? memory?.title : memory?.content) ?? memory?.content ?? '');
  const [type, setType] = useState<MemoryType>(memory?.memory_type ?? 'procedural');
  const [project, setProject] = useState(memory?.project_id ?? projects[0]?.id ?? '');
  const pending = create.isPending || update.isPending;
  const error = create.error ?? update.error;

  function save() {
    const done = (msg: string) => () => {
      onOpenChange(false);
      toast.success(msg);
    };
    if (memory) update.mutate({ id: memory.id, request: { op: 'edit', content, memory_type: isDecision ? undefined : type } }, { onSuccess: done(isDecision ? 'Decision updated' : 'Memory updated') });
    else create.mutate({ content, memory_type: type, project_id: project || null }, { onSuccess: done('Memory added') });
  }

  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
      title={isDecision ? 'Edit decision' : memory ? 'Edit memory' : 'Add memory'}
      description={memory ? 'Edits are saved as yours (origin: user-created).' : 'Memories you add are confirmed immediately.'}
      footer={
        <>
          <Button onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button variant="primary" onClick={save} loading={pending} loadingText="Saving…" disabled={!content.trim()}>
            {memory ? 'Save changes' : 'Add memory'}
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-4">
        <Field label={isDecision ? 'Decision title' : 'What should ORIVANA remember?'} error={error?.message}>
          {({ id, describedBy, invalid }) => <Textarea id={id} name="memory" autoComplete="off" value={content} onChange={(e) => setContent(e.target.value)} aria-describedby={describedBy} aria-invalid={invalid} placeholder="e.g. Use a fixed random seed for every evaluation run…" />}
        </Field>
        <div className="grid gap-4 sm:grid-cols-2">
          {!isDecision ? (
            <Field label="Type">
              {({ id }) => (
                <Select id={id} value={type} onChange={(e) => setType(e.target.value as MemoryType)}>
                  <option value="episodic">Episodic</option>
                  <option value="semantic">Semantic</option>
                  <option value="procedural">Procedural</option>
                  <option value="project">Project</option>
                </Select>
              )}
            </Field>
          ) : null}
          {!memory ? (
            <Field label="Project">
              {({ id }) => (
                <Select id={id} value={project} onChange={(e) => setProject(e.target.value)}>
                  <option value="">No project</option>
                  {projects.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </Select>
              )}
            </Field>
          ) : null}
        </div>
      </div>
    </Dialog>
  );
}

/** Choose the confirmed memory that replaces this one. */
export function SupersedeDialog({ memory, open, onOpenChange }: { memory: Memory; open: boolean; onOpenChange: (open: boolean) => void }) {
  const isDecision = memory.kind === 'decision';
  const { data } = useMemories({ status: 'confirmed', project_id: memory.project_id ?? undefined, decisions_only: isDecision || undefined });
  const options = (data?.items ?? []).filter((m) => m.id !== memory.id);
  const [target, setTarget] = useState('');
  const update = useUpdateMemory();
  const toast = useToast();
  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
      title="Mark superseded"
      description={`“${memory.title ?? memory.content}” stays in history but is no longer used as a current ${isDecision ? 'decision' : 'fact'}.`}
      footer={
        <>
          <Button onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button
            variant="primary"
            disabled={!target}
            loading={update.isPending}
            loadingText="Saving…"
            onClick={() => update.mutate({ id: memory.id, request: { op: 'supersede', superseded_by_id: target } }, { onSuccess: () => { onOpenChange(false); toast.success('Marked as superseded'); } })}
          >
            Mark superseded
          </Button>
        </>
      }
    >
      <Field label="Replaced by" error={update.error?.message} hint={options.length ? undefined : `Add or confirm the newer ${isDecision ? 'decision' : 'memory'} first.`}>
        {({ id, describedBy }) => (
          <Select id={id} value={target} onChange={(e) => setTarget(e.target.value)} aria-describedby={describedBy}>
            <option value="">{isDecision ? 'Choose a confirmed decision…' : 'Choose a confirmed memory…'}</option>
            {options.map((m) => (
              <option key={m.id} value={m.id}>
                {m.decision ? `${m.decision.code} ${m.title ?? m.content}` : m.content}
              </option>
            ))}
          </Select>
        )}
      </Field>
    </Dialog>
  );
}

export function DeleteMemoryDialog({ memory, open, onOpenChange }: { memory: Memory; open: boolean; onOpenChange: (open: boolean) => void }) {
  const del = useDeleteMemory();
  const toast = useToast();
  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
      title="Delete this memory?"
      description="This can’t be undone. Answers stop using it immediately. The audit log keeps a record that it was deleted, without its content."
      footer={
        <>
          <Button onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button variant="danger-solid" loading={del.isPending} loadingText="Deleting…" onClick={() => del.mutate(memory.id, { onSuccess: () => { onOpenChange(false); toast.success('Memory deleted'); } })}>
            Delete memory
          </Button>
        </>
      }
    >
      <p className="rounded-card border border-subtle bg-surface p-4 text-base text-fg">{memory.content}</p>
      {del.error ? <p role="alert" className="mt-2 text-sm text-danger">{del.error.message}</p> : null}
    </Dialog>
  );
}
