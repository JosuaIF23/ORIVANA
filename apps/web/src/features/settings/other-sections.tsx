import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { getSessions, revokeOtherSessions } from '@/services/auth';
import { formatAgo, formatDate } from '@/lib/format';
import { qk } from '@/hooks/query-keys';
import { useMe } from '@/hooks/use-session';
import { useConnectionsList } from '@/hooks/use-data';
import { Button, ButtonLink } from '@/components/ui/button';
import { MetaList, Card } from '@/components/ui/primitives';
import { StatusBadge } from '@/components/common/status-badge';
import { LoadingSkeleton } from '@/components/common/states';
import { useToast } from '@/components/common/toast';

export function ProfileSection() {
  const { data: me } = useMe();
  if (!me) return <LoadingSkeleton className="mt-6" rows={2} />;
  return (
    <MetaList className="mt-6" labelWidth="w-36" rows={[['Name', me.user.name ?? '—'], ['Email', me.user.email], ['Workspace', `${me.workspace.name} · ${me.role}`], ['Member since', formatDate(me.user.created_at)]]} />
  );
}

export function SecuritySection() {
  const qc = useQueryClient();
  const toast = useToast();
  const { data } = useQuery({ queryKey: qk.sessions, queryFn: getSessions });
  const revoke = useMutation({ mutationFn: revokeOtherSessions, onSuccess: (r) => { void qc.invalidateQueries({ queryKey: qk.sessions }); toast.success(`Signed out ${r.revoked} other ${r.revoked === 1 ? 'session' : 'sessions'}`); } });
  if (!data) return <LoadingSkeleton className="mt-6" rows={2} />;
  const others = data.filter((s) => !s.current && !s.revoked_at).length;
  return (
    <div className="mt-6">
      <ul className="divide-y divide-subtle rounded-card border border-subtle">
        {data.map((s) => (
          <li key={s.id} className="flex flex-wrap items-center justify-between gap-3 px-5 py-4">
            <div>
              <p className="text-base text-fg">{s.user_agent}{s.current ? ' · this device' : ''}</p>
              <p className="text-sm text-fg-secondary">Signed in {formatAgo(s.created_at)} · IP <span className="font-mono">{s.ip}</span></p>
            </div>
            {s.revoked_at ? <StatusBadge status="revoked" /> : s.current ? <StatusBadge status="active" /> : null}
          </li>
        ))}
      </ul>
      <Button className="mt-4" disabled={others === 0} loading={revoke.isPending} loadingText="Signing out…" onClick={() => revoke.mutate()}>
        Sign out other sessions
      </Button>
    </div>
  );
}

export function ConnectedAppsSection() {
  const { data } = useConnectionsList();
  return (
    <Card className="mt-6 flex flex-wrap items-center justify-between gap-4 p-5">
      <p className="text-base text-fg-secondary">{data?.connections.length ? data.connections.map((c) => `${c.provider === 'zotero' ? 'Zotero (read only)' : 'GitHub'} · ${c.account_label}`).join(' · ') + '.' : 'No apps connected.'} Manage scopes and revoke access in Integrations.</p>
      <ButtonLink to="/integrations">Open Integrations</ButtonLink>
    </Card>
  );
}

export function NotificationsSection() {
  return <p className="mt-4 text-base text-fg-secondary">ORIVANA emails you when a decision needs review, when an export is ready, and when a connected app needs to be reconnected. In-app notifications appear under the bell in the top bar.</p>;
}

export function AppearanceSection() {
  return <p className="mt-4 text-base text-fg-secondary">Dark theme. A light theme is planned after the MVP.</p>;
}
