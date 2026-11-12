import { useState } from 'react';
import { Link } from 'react-router';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Ban, Check, Eye, Lock, Pencil, TriangleAlert } from 'lucide-react';
import type { ToolConnection } from '@contracts/types';
import { connectGitHub, reconnect, revokeConnection } from '@/services/connections';
import { formatAgo, formatDate } from '@/lib/format';
import { qk } from '@/hooks/query-keys';
import { useProposals } from '@/hooks/use-data';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/primitives';
import { Dialog } from '@/components/ui/dialog';
import { StatusBadge } from '@/components/common/status-badge';
import { InlineAlert } from '@/components/common/states';
import { useToast } from '@/components/common/toast';

const SCOPE_ICON = { read: <Check className="text-knowledge" />, write_with_approval: <Pencil className="text-warning" />, not_granted: <Ban className="text-fg-secondary" /> };

function useInvalidate() {
  const qc = useQueryClient();
  return () => {
    void qc.invalidateQueries({ queryKey: qk.connections });
    void qc.invalidateQueries({ queryKey: qk.proposalsAll });
    void qc.invalidateQueries({ queryKey: qk.me });
  };
}

export function GitHubCard({ connection: c }: { connection: ToolConnection }) {
  const invalidate = useInvalidate();
  const toast = useToast();
  const [revoking, setRevoking] = useState(false);
  const recon = useMutation({ mutationFn: () => reconnect(c.id), onSuccess: () => { invalidate(); toast.success('GitHub reconnected'); } });
  const revoke = useMutation({ mutationFn: () => revokeConnection(c.id), onSuccess: (r) => { invalidate(); setRevoking(false); toast.success(`GitHub access revoked; ${r.cancelled_proposals} pending proposals cancelled`); } });
  const { data: proposals } = useProposals('pending');
  const pending = proposals?.items.filter((p) => p.connection_id === c.id && (p.status === 'awaiting_approval' || p.status === 'draft')).length ?? 0;
  return (
    <Card className="p-6 md:p-8">
      <div className="flex flex-wrap items-start gap-4">
        <span aria-hidden="true" className="flex size-14 items-center justify-center rounded-card bg-elevated text-xl font-semibold text-fg">G</span>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-3">
            <h2 className="text-xl font-semibold text-fg">GitHub</h2>
            <StatusBadge status={c.status} size="md" />
          </div>
          <p className="mt-1 text-base text-fg-secondary">
            Account <span className="font-mono text-sm">{c.account_label}</span> · connected {formatDate(c.connected_at)} · last sync {formatAgo(c.last_sync_at)} · health check {c.health}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <span className="inline-flex h-8 items-center gap-1.5 rounded-badge border border-control px-2.5 text-sm text-fg-secondary"><Eye aria-hidden="true" className="size-4" />Read</span>
          <span className="inline-flex h-8 items-center gap-1.5 rounded-badge border border-warning/60 px-2.5 text-sm text-warning"><Pencil aria-hidden="true" className="size-4" />Create issue · approval required</span>
        </div>
      </div>
      {c.status === 'needs_reconnect' ? (
        <InlineAlert className="mt-6" tone="warning" icon={<TriangleAlert className="text-warning" />} title="Needs reconnect">
          {c.status_detail}
        </InlineAlert>
      ) : null}
      <div className="mt-8 flex items-baseline justify-between gap-4">
        <h3 className="text-base text-fg-secondary">Repositories ORIVANA can see · {c.repositories.length} selected</h3>
        <a href="https://github.com/settings/installations" target="_blank" rel="noreferrer" className="rounded-control text-base text-fg-secondary hover:text-fg">
          Manage repositories
        </a>
      </div>
      <ul className="mt-3 flex flex-wrap gap-3">
        {c.repositories.map((r) => (
          <li key={r.full_name} className="rounded-control border border-subtle px-4 py-2 text-base">
            <span className="font-mono text-sm text-fg">{r.full_name}</span> <span className="text-fg-secondary">{r.visibility}</span>
          </li>
        ))}
      </ul>
      <h3 className="mt-8 text-base text-fg-secondary">Granted permissions, in plain language</h3>
      <ul className="mt-3 divide-y divide-subtle rounded-card border border-subtle">
        {c.grant.scopes.map((s) => (
          <li key={s.label} className="flex items-center gap-4 px-5 py-4 text-base text-fg [&_svg]:size-5">
            <span aria-hidden="true">{SCOPE_ICON[s.kind]}</span>
            <span className="flex-1">
              {s.kind === 'write_with_approval' ? (
                <>
                  Create new issues — <strong className="font-semibold">only after you approve each one</strong> in <Link to="/approvals" className="text-accent underline underline-offset-4">Approvals</Link>
                </>
              ) : (
                s.label
              )}
            </span>
            {s.scope ? <span className="font-mono text-xs text-fg-secondary">{s.scope}</span> : null}
          </li>
        ))}
      </ul>
      <p className="mt-4 flex items-center gap-2 text-sm text-fg-secondary">
        <Lock aria-hidden="true" className="size-4" />
        Access tokens are encrypted on the server and are never shown in the browser.
      </p>
      <div className="mt-6 flex flex-wrap items-center gap-4 border-t border-subtle pt-6">
        <Button size="lg" onClick={() => recon.mutate()} loading={recon.isPending} loadingText="Reconnecting…">
          {c.status === 'needs_reconnect' ? 'Reconnect GitHub' : 'Reconnect'}
        </Button>
        <p className="min-w-0 flex-1 text-sm text-fg-secondary">{`Revoking stops all reads and cancels ${pending} pending ${pending === 1 ? 'proposal' : 'proposals'}.`} Issues already created stay on GitHub.</p>
        <Button variant="danger" size="lg" onClick={() => setRevoking(true)}>
          Revoke access…
        </Button>
      </div>
      <Dialog
        open={revoking}
        onOpenChange={setRevoking}
        title="Revoke GitHub access?"
        description={`ORIVANA stops reading your repositories and cancels ${pending} pending ${pending === 1 ? 'proposal' : 'proposals'}. Issues already created stay on GitHub. You can connect again later.`}
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

/** Shown when GitHub is not connected: explain, then request minimum scopes. */
export function ConnectGitHubCard() {
  const invalidate = useInvalidate();
  const connect = useMutation({ mutationFn: connectGitHub, onSuccess: invalidate });
  return (
    <Card className="p-8">
      <h2 className="text-xl font-semibold text-fg">Connect GitHub</h2>
      <p className="mt-2 text-base text-fg-secondary">ORIVANA reads the repositories you select and their issues. It can create an issue only after you approve each one. It never pushes code, comments, or deletes anything.</p>
      <Button variant="primary" size="lg" className="mt-6" onClick={() => connect.mutate()} loading={connect.isPending} loadingText="Waiting for GitHub…">
        Continue to GitHub
      </Button>
      {connect.error ? <p role="alert" className="mt-3 text-sm text-danger">{connect.error.message}</p> : null}
    </Card>
  );
}
