import { useState } from 'react';
import { Check, Library, Lock } from 'lucide-react';
import { useProjectsList } from '@/hooks/use-data';
import { Button, ButtonLink } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/controls';
import { Dialog } from '@/components/ui/dialog';
import { Field, Select } from '@/components/ui/field';
import { ErrorState, InlineAlert, LoadingSkeleton } from '@/components/common/states';
import { StatusBadge } from '@/components/common/status-badge';
import { useConnectZotero, useSyncZotero, useZoteroCollections, useZoteroConnection, useZoteroSync } from './use-zotero';

const READ_ONLY = 'ORIVANA reads your items, PDFs, and highlights. It never changes your Zotero library.';

/** Import from Zotero (UI.md §4.6): connect → collections → project → summary → progress. */
export function ZoteroImportDialog({ open, onOpenChange, defaultProjectId }: { open: boolean; onOpenChange: (open: boolean) => void; defaultProjectId?: string | null }) {
  const { connection, isPending: loadingConnection } = useZoteroConnection();
  const connect = useConnectZotero();
  const collections = useZoteroCollections(open && Boolean(connection));
  const { data: projects = [] } = useProjectsList();
  const sync = useSyncZotero();
  const progress = useZoteroSync(sync.data?.sync_id ?? null);
  const [chosen, setChosen] = useState<Set<string>>(new Set());
  const [project, setProject] = useState<string | null>(null);
  const target = project ?? defaultProjectId ?? projects[0]?.id ?? '';
  const picked = (collections.data?.collections ?? []).filter((c) => chosen.has(c.key));
  const items = picked.reduce((n, c) => n + c.item_count, 0);
  const pdfs = picked.reduce((n, c) => n + c.pdf_count, 0);
  const run = progress.data ?? sync.data;
  const done = run?.status === 'succeeded';
  const toggle = (key: string, on: boolean) =>
    setChosen((prev) => {
      const next = new Set(prev);
      if (on) next.add(key);
      else next.delete(key);
      return next;
    });

  const footer = run ? (
    done ? (
      <>
        <ButtonLink to="/knowledge/matrix" onClick={() => onOpenChange(false)}>Open Matrix</ButtonLink>
        <ButtonLink to="/knowledge/sources?type=zotero" variant="primary" onClick={() => onOpenChange(false)}>View in Sources</ButtonLink>
      </>
    ) : (
      <Button onClick={() => onOpenChange(false)}>Continue in background</Button>
    )
  ) : connection ? (
    <>
      <Button onClick={() => onOpenChange(false)}>Cancel</Button>
      <Button variant="primary" disabled={!picked.length} loading={sync.isPending} loadingText="Starting import…" onClick={() => sync.mutate({ collection_keys: [...chosen], project_id: target || null })}>
        Import
      </Button>
    </>
  ) : (
    <>
      <Button onClick={() => onOpenChange(false)}>Cancel</Button>
      <Button variant="primary" loading={connect.isPending} loadingText="Connecting…" onClick={() => connect.mutate()}>
        Connect Zotero
      </Button>
    </>
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange} title="Import from Zotero" description={READ_ONLY} icon={<Library aria-hidden="true" className="mt-0.5 size-6 text-knowledge" />} footer={footer} className="max-w-2xl">
      {loadingConnection ? (
        <LoadingSkeleton rows={3} label="Checking Zotero…" />
      ) : run ? (
        <div className="flex flex-col gap-4" aria-live="polite">
          <p className="flex items-center gap-3 text-base text-fg">
            <StatusBadge status={done ? 'succeeded' : 'in_progress'} label={done ? 'Import finished' : 'Importing…'} />
            {run.counts.new} new · {run.counts.unchanged} unchanged{run.counts.removed ? ` · ${run.counts.removed} removed in Zotero` : ''}
          </p>
          <ul className="flex max-h-72 flex-col divide-y divide-subtle overflow-y-auto rounded-card border border-subtle">
            {run.items.map((i) => (
              <li key={i.item_key} className="flex items-center justify-between gap-3 px-4 py-2.5 text-sm">
                <span className="min-w-0 truncate text-fg">{i.title}</span>
                <span className="shrink-0 text-fg-secondary">{i.state === 'new' ? (done ? 'Added · processing' : 'Adding…') : i.state === 'removed' ? 'Removed in Zotero' : 'Unchanged'}</span>
              </li>
            ))}
          </ul>
          <p className="text-sm text-fg-secondary">New items are parsed, indexed, and extracted, then checked against your decisions.</p>
        </div>
      ) : !connection ? (
        <div className="flex flex-col gap-4">
          <ul className="flex flex-col gap-2 text-sm text-fg">
            {['Read your items and their metadata', 'Download attached PDFs', 'Read your highlights and notes'].map((s) => (
              <li key={s} className="flex items-center gap-2"><Check aria-hidden="true" className="size-4 text-knowledge" />{s}</li>
            ))}
            <li className="flex items-center gap-2 text-fg-secondary"><Lock aria-hidden="true" className="size-4" />Never changes or deletes anything in Zotero</li>
          </ul>
          {connect.error ? <InlineAlert tone="danger" title="Zotero didn’t connect" live>{connect.error.message}</InlineAlert> : null}
        </div>
      ) : collections.isPending ? (
        <LoadingSkeleton rows={4} label="Loading collections…" />
      ) : collections.error ? (
        <ErrorState error={collections.error} onRetry={() => collections.refetch()} />
      ) : (
        <div className="flex flex-col gap-5">
          <fieldset>
            <legend className="text-sm font-medium text-fg-secondary">Collections in {collections.data.library_label}</legend>
            <ul className="mt-2 flex flex-col gap-1">
              {collections.data.collections.map((c) => (
                <li key={c.key} className={c.parent_key ? 'pl-7' : undefined}>
                  <label className="flex min-h-11 cursor-pointer items-center gap-3 rounded-control px-2 hover:bg-surface">
                    <Checkbox checked={chosen.has(c.key)} onCheckedChange={(v) => toggle(c.key, v)} />
                    <span className="flex-1 text-sm text-fg">{c.name}</span>
                    <span className="text-xs text-fg-secondary tabular">{c.item_count} items · {c.pdf_count} PDFs</span>
                    {c.synced_project_id ? <span className="text-xs text-knowledge">Synced</span> : null}
                  </label>
                </li>
              ))}
            </ul>
          </fieldset>
          <Field label="Add to project">
            {({ id }) => (
              <Select id={id} value={target} onChange={(e) => setProject(e.target.value)}>
                <option value="">No project</option>
                {projects.map((p) => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </Select>
            )}
          </Field>
          <p role="status" className="rounded-card border border-subtle bg-surface p-4 text-sm text-fg">
            {picked.length ? `Import ${items} items (${pdfs} with PDF). Nothing will be changed in Zotero.` : 'Choose at least one collection.'}
          </p>
          {sync.error ? <InlineAlert tone="danger" title="Import didn’t start" live>{sync.error.message}</InlineAlert> : null}
        </div>
      )}
    </Dialog>
  );
}
