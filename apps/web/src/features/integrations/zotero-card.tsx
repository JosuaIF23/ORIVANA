import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Ban, Check, Library, Lock, RefreshCw } from 'lucide-react';
import type { ToolConnection } from '@contracts/types';
import { revokeConnection } from '@/services/connections';
import { formatAgo, formatDate } from '@/lib/format';
import { qk } from '@/hooks/query-keys';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/primitives';
import { Dialog } from '@/components/ui/dialog';
import { StatusBadge } from '@/components/common/status-badge';
import { useToast } from '@/components/common/toast';
import { ZoteroImportDialog } from '@/features/zotero/zotero-import-dialog';
import { useConnectZotero, useSyncZotero, useZoteroSync } from '@/features/zotero/use-zotero';

const SCOPE = 'Read your items, PDFs, and highlights. ORIVANA never changes your Zotero library.';

/** Zotero card (UI.md §4.14): read only, collections, last sync, Sync now, Manage collections, Revoke. */
export function ZoteroCard({ connection: c }: { connection: ToolConnection }) {
  const qc = useQueryClient();
  const toast = useToast();
  const [managing, setManaging] = useState(false);
  const [revoking, setRevoking] = useState(false);
  const sync = useSyncZotero();
  const progress = useZoteroSync(sync.data?.sync_id ?? null);
  const run = progress.data ?? sync.data;
  const syncing = sync.isPending || run?.status === 'running' || run?.status === 'queued';
  const revoke = useMutation({
    mutationFn: () => revokeConnection(c.id),
    onSuccess: () => {
      for (const key of [qk.connections, qk.auditAll]) void qc.invalidateQueries({ queryKey: key });
      setRevoking(false);
      toast.success('Zotero access revoked · imported sources stay in ORIVANA');
    },
  });
  // Already-synced collections keep their project; only changed items are fetched.
  const syncNow = () => sync.mutate({ collection_keys: c.collections?.map((x) => x.key) ?? [], project_id: null }, { onError: (e) => toast.error(e.message) });

  return (
    <Card className="p-6 md:p-8">
      <div className="flex flex-wrap items-start gap-4">
        <span aria-hidden="true" className="flex size-14 items-center justify-center rounded-card bg-elevated text-knowledge">
          <Library className="size-7" />
        </span>
        <div className="min-w-60 flex-1">
          <div className="flex flex-wrap items-center gap-3">
            <h2 className="text-xl font-semibold text-fg">Zotero</h2>
            <StatusBadge status={c.status} size="md" />
            <StatusBadge status="read_only" size="md" />
          </div>
          <p className="mt-1 text-base text-fg-secondary">
            Account <span className="font-mono text-sm">{c.account_label}</span> · {c.library_label} · connected {formatDate(c.connected_at)}
          </p>
        </div>
      </div>
      <p className="mt-5 text-base text-fg">{SCOPE}</p>
      <ul className="mt-3 flex flex-col gap-2 text-sm">
        {c.grant.scopes.map((s) => (
          <li key={s.label} className="flex items-center gap-2 text-fg-secondary">
            {s.kind === 'not_granted' ? <Ban aria-hidden="true" className="size-4" /> : <Check aria-hidden="true" className="size-4 text-knowledge" />}
            <span className={s.kind === 'not_granted' ? undefined : 'text-fg'}>{s.kind === 'not_granted' ? `Not granted: ${s.label.charAt(0).toLowerCase()}${s.label.slice(1)}` : s.label}</span>
            {s.scope ? <span className="font-mono text-xs text-fg-muted">{s.scope}</span> : null}
          </li>
        ))}
      </ul>
      <section aria-labelledby="zotero-collections" className="mt-6">
        <h3 id="zotero-collections" className="text-sm font-medium text-fg-secondary">
          Collections synced · {c.collections?.length ?? 0}
        </h3>
        <ul className="mt-2 flex flex-wrap gap-2">
          {c.collections?.map((x) => (
            <li key={x.key} className="rounded-full border border-control px-3 py-1 text-sm text-fg">
              {x.name} · {x.item_count} items
            </li>
          ))}
        </ul>
        <p className="mt-3 text-sm text-fg-secondary" aria-live="polite">
          {syncing ? 'Syncing… only changed items are fetched.' : run?.status === 'succeeded' ? `Synced just now · ${run.counts.new} new, ${run.counts.unchanged} unchanged${run.counts.removed ? `, ${run.counts.removed} removed in Zotero` : ''}` : `Last sync ${formatAgo(c.last_sync_at)}`}
        </p>
      </section>
      <div className="mt-6 flex flex-wrap gap-3">
        <Button variant="primary" onClick={syncNow} loading={syncing} loadingText="Syncing…" disabled={!c.collections?.length}>
          <RefreshCw aria-hidden="true" />
          Sync now
        </Button>
        <Button onClick={() => setManaging(true)}>Manage collections</Button>
        <Button variant="danger" className="ml-auto" onClick={() => setRevoking(true)}>
          Revoke access…
        </Button>
      </div>
      {managing ? <ZoteroImportDialog open onOpenChange={setManaging} /> : null}
      <Dialog
        open={revoking}
        onOpenChange={setRevoking}
        title="Revoke Zotero access?"
        description="ORIVANA stops syncing. Sources already imported stay in ORIVANA until you delete them. Nothing changes in Zotero."
        footer={
          <>
            <Button onClick={() => setRevoking(false)}>Cancel</Button>
            <Button variant="danger-solid" loading={revoke.isPending} loadingText="Revoking…" onClick={() => revoke.mutate()}>
              Revoke access
            </Button>
          </>
        }
      />
    </Card>
  );
}

/** Not connected yet: explain read-only access, then connect and choose collections. */
export function ConnectZoteroCard() {
  const connect = useConnectZotero();
  const [importing, setImporting] = useState(false);
  return (
    <Card className="p-6 md:p-8">
      <div className="flex items-start gap-4">
        <span aria-hidden="true" className="flex size-14 items-center justify-center rounded-card bg-elevated text-knowledge">
          <Library className="size-7" />
        </span>
        <div className="min-w-0 flex-1">
          <h2 className="text-xl font-semibold text-fg">Zotero</h2>
          <p className="mt-1 text-base text-fg-secondary">{SCOPE}</p>
          <p className="mt-2 flex items-center gap-2 text-sm text-fg-secondary">
            <Lock aria-hidden="true" className="size-4" />
            Read only. You choose which collections to import.
          </p>
        </div>
      </div>
      <Button variant="primary" className="mt-6" loading={connect.isPending} loadingText="Connecting…" onClick={() => connect.mutate(undefined, { onSuccess: () => setImporting(true) })}>
        Connect Zotero
      </Button>
      {importing ? <ZoteroImportDialog open onOpenChange={setImporting} /> : null}
    </Card>
  );
}
