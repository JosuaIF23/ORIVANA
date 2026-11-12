import { Fragment, useState } from 'react';
import type { Memory, MemoryStatus } from '@contracts/types';
import { cn } from '@/lib/cn';
import { MemoryRow } from './memory-row';
import { DeleteMemoryDialog, MemoryFormDialog, SupersedeDialog } from './memory-dialogs';

const GROUP: Record<MemoryStatus, { label: string; cls: string }> = {
  candidate: { label: 'Needs review', cls: 'text-warning' },
  confirmed: { label: 'Confirmed', cls: 'text-knowledge' },
  superseded: { label: 'Superseded', cls: 'text-fg-secondary' },
  rejected: { label: 'Rejected', cls: 'text-danger' },
};

type Dialogs = { kind: 'edit' | 'supersede' | 'delete'; memory: Memory } | null;

/** Memory list grouped by status (candidates first), with row actions. */
export function MemoryTable({ items, grouped }: { items: Memory[]; grouped: boolean }) {
  const [dialog, setDialog] = useState<Dialogs>(null);
  const groups = grouped ? (['candidate', 'confirmed', 'superseded', 'rejected'] as MemoryStatus[]).map((s) => [s, items.filter((m) => m.status === s)] as const).filter(([, list]) => list.length) : [[null, items] as const];
  const close = (open: boolean) => !open && setDialog(null);
  return (
    <div className="overflow-x-auto rounded-card border border-subtle">
      <table className="w-full min-w-[1060px] border-collapse text-left">
        <thead>
          <tr className="border-b border-subtle bg-surface text-sm text-fg-secondary">
            <th scope="col" className="w-20 px-3 py-3 font-medium">Type</th>
            <th scope="col" className="px-3 py-3 font-medium">Content</th>
            <th scope="col" className="w-28 px-3 py-3 font-medium">Project</th>
            <th scope="col" className="w-36 px-3 py-3 font-medium">Origin</th>
            <th scope="col" className="w-36 px-3 py-3 font-medium">Source / evidence</th>
            <th scope="col" className="w-20 px-3 py-3 font-medium">Updated</th>
            <th scope="col" className="w-28 px-3 py-3 font-medium">Status</th>
            <th scope="col" className="w-12 px-3 py-3 text-right font-medium">Conf.</th>
            <th scope="col" className="w-40 px-3 py-3">
              <span className="sr-only">Actions</span>
            </th>
          </tr>
        </thead>
        <tbody>
          {groups.map(([status, list]) => (
            <Fragment key={status ?? 'all'}>
              {status ? (
                <tr className="border-b border-subtle bg-surface/60">
                  <th scope="rowgroup" colSpan={9} className={cn('px-4 py-2.5 text-left text-sm font-medium', GROUP[status].cls)}>
                    {GROUP[status].label} · {list.length}
                  </th>
                </tr>
              ) : null}
              {list.map((m) => (
                <MemoryRow key={m.id} memory={m} all={items} onEdit={() => setDialog({ kind: 'edit', memory: m })} onSupersede={() => setDialog({ kind: 'supersede', memory: m })} onDelete={() => setDialog({ kind: 'delete', memory: m })} />
              ))}
            </Fragment>
          ))}
        </tbody>
      </table>
      {dialog?.kind === 'edit' ? <MemoryFormDialog memory={dialog.memory} open onOpenChange={close} /> : null}
      {dialog?.kind === 'supersede' ? <SupersedeDialog memory={dialog.memory} open onOpenChange={close} /> : null}
      {dialog?.kind === 'delete' ? <DeleteMemoryDialog memory={dialog.memory} open onOpenChange={close} /> : null}
    </div>
  );
}
