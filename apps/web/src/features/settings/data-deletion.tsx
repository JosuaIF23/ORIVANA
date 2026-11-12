import { useState } from 'react';
import { ButtonLink, Button } from '@/components/ui/button';
import { Card } from '@/components/ui/primitives';
import { useMe } from '@/hooks/use-session';
import { DeleteAccountDialog, DeleteWorkspaceDialog } from './delete-dialogs';

export function DataDeletion() {
  const { data: me } = useMe();
  const [dialog, setDialog] = useState<'workspace' | 'account' | null>(null);
  const rows = [
    { title: 'Delete a single source', body: 'Removes its chunks, embeddings, graph evidence, and citations in past answers.', action: <ButtonLink to="/knowledge/sources">Choose in Sources</ButtonLink> },
    { title: 'Delete all workspace data', body: `Empties ${me?.workspace.name ?? 'this workspace'}. Your account and sign-in stay active.`, action: <Button variant="danger" onClick={() => setDialog('workspace')}>Delete workspace data…</Button> },
    { title: 'Delete account', body: 'Deletes all workspaces, revokes connected apps, and closes your account.', action: <Button variant="danger" onClick={() => setDialog('account')}>Delete account…</Button> },
  ];
  return (
    <div className="mt-2">
      <p className="text-base text-fg-secondary">Deletion is permanent and propagates to everything derived from your data. Export first if you might need it.</p>
      <Card className="mt-6 divide-y divide-subtle border-danger/30">
        {rows.map((r) => (
          <div key={r.title} className="flex flex-wrap items-center justify-between gap-4 p-6">
            <div className="min-w-0">
              <h3 className="text-base font-semibold text-fg">{r.title}</h3>
              <p className="mt-0.5 text-sm text-fg-secondary">{r.body}</p>
            </div>
            {r.action}
          </div>
        ))}
      </Card>
      <DeleteWorkspaceDialog open={dialog === 'workspace'} onOpenChange={(o) => setDialog(o ? 'workspace' : null)} />
      <DeleteAccountDialog open={dialog === 'account'} onOpenChange={(o) => setDialog(o ? 'account' : null)} />
    </div>
  );
}
