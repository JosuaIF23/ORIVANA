import { useState } from 'react';
import { Library, Lock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/primitives';
import { StatusBadge } from '@/components/common/status-badge';
import { InlineAlert } from '@/components/common/states';
import { ZoteroImportDialog } from '@/features/zotero/zotero-import-dialog';
import { useConnectZotero, useZoteroConnection } from '@/features/zotero/use-zotero';

/** Onboarding 2 primary option (UI.md v2 §4.3): Connect Zotero (recommended), read only. */
export function ZoteroFirstCard({ projectId }: { projectId: string | null }) {
  const { connection } = useZoteroConnection();
  const connect = useConnectZotero();
  const [choosing, setChoosing] = useState(false);
  return (
    <Card className="border-accent/50 p-6">
      <div className="flex flex-wrap items-start gap-4">
        <span aria-hidden="true" className="flex size-12 items-center justify-center rounded-card bg-elevated text-knowledge">
          <Library className="size-6" />
        </span>
        <div className="min-w-60 flex-1">
          <h2 className="flex flex-wrap items-center gap-2 text-lg font-semibold text-fg">
            Connect Zotero
            <StatusBadge status="recommended" />
          </h2>
          <p className="mt-1 text-base text-fg-secondary">Import whole collections with their PDFs and highlights. New items sync later and are checked against your decisions.</p>
          <p className="mt-2 flex items-center gap-2 text-sm text-fg-secondary">
            <Lock aria-hidden="true" className="size-4" />
            Read only — ORIVANA never changes your Zotero library.
          </p>
        </div>
        {connection ? (
          <Button variant="primary" size="lg" onClick={() => setChoosing(true)}>
            Choose collections
          </Button>
        ) : (
          <Button variant="primary" size="lg" loading={connect.isPending} loadingText="Connecting…" onClick={() => connect.mutate(undefined, { onSuccess: () => setChoosing(true) })}>
            Connect Zotero
          </Button>
        )}
      </div>
      {connection ? <p className="mt-4 text-sm text-knowledge">Connected as {connection.account_label}. {connection.collections?.length ? `${connection.collections.length} collection${connection.collections.length === 1 ? '' : 's'} syncing.` : 'Choose the collections to import.'}</p> : null}
      {connect.error ? <InlineAlert tone="danger" className="mt-4" title="Zotero didn’t connect" live>{connect.error.message}</InlineAlert> : null}
      {choosing ? <ZoteroImportDialog open onOpenChange={setChoosing} defaultProjectId={projectId} /> : null}
    </Card>
  );
}
