import type { ConnectionsResponse, Repository, ToolConnection } from '@contracts/types';
import { nowIso } from '@/lib/clock';
import { fixtures } from './core/fixtures';
import { failWith, simulate } from './core/http';
import { recordAudit, requireDb } from './core/session';

/** GET /api/v1/connections */
export function listConnections(): Promise<ConnectionsResponse> {
  return simulate(() => {
    const db = requireDb();
    return { connections: db.connections.filter((c) => c.status !== 'revoked'), catalog: db.catalog };
  }, { ms: 300 });
}

/**
 * POST /api/v1/connections then GET /connections/github/callback.
 * The prototype skips the provider redirect and completes the OAuth round trip.
 */
export function connectGitHub(): Promise<ToolConnection> {
  return simulate(() => {
    const db = requireDb();
    const existing = db.connections.find((c) => c.provider === 'github');
    const connection = structuredClone(fixtures.connections.list.connections.find((c) => c.provider === 'github')!);
    Object.assign(connection, { workspace_id: db.me.workspace.id, connected_at: nowIso(), last_checked_at: nowIso(), last_sync_at: nowIso() });
    if (existing) Object.assign(existing, connection);
    else db.connections.push(connection);
    recordAudit(db, { actor_type: 'user', category: 'tool_calls', event_type: 'connection.created', target_type: 'connection', target_id: connection.id, summary: 'Connected GitHub as {link}', link: { label: connection.account_label, target_type: 'repository', target_id: connection.account_label }, result: 'succeeded' });
    return existing ?? connection;
  }, { ms: 1100 });
}

/** POST /api/v1/connections/{id}/reconnect (extension) */
export function reconnect(id: string): Promise<ToolConnection> {
  return simulate(() => {
    const connection = requireDb().connections.find((c) => c.id === id);
    if (!connection) failWith('NOT_FOUND', 'Connection not found.');
    Object.assign(connection, { status: 'connected', health: 'passed', status_detail: null, last_checked_at: nowIso(), last_sync_at: nowIso() });
    return connection;
  }, { ms: 1000 });
}

/** DELETE /api/v1/connections/{id} — revoking cancels pending proposals. */
export function revokeConnection(id: string): Promise<{ revoked_connection_id: string; cancelled_proposals: number }> {
  return simulate(() => {
    const db = requireDb();
    const connection = db.connections.find((c) => c.id === id);
    if (!connection) failWith('NOT_FOUND', 'Connection not found.');
    connection.status = 'revoked';
    let cancelled = 0;
    for (const p of db.proposals) {
      if (p.connection_id === id && ['awaiting_approval', 'draft'].includes(p.status)) {
        p.status = 'expired';
        p.decided_at = nowIso();
        cancelled += 1;
      }
    }
    recordAudit(db, { actor_type: 'user', category: 'tool_calls', event_type: 'connection.revoked', target_type: 'connection', target_id: id, summary: connection.provider === 'zotero' ? 'Revoked Zotero access; imported sources stay in ORIVANA' : `Revoked GitHub access; ${cancelled} pending proposals cancelled`, link: null, result: 'succeeded' });
    return { revoked_connection_id: id, cancelled_proposals: cancelled };
  }, { ms: 800 });
}

/** GET /api/v1/connections/{id}/repositories (extension) */
export function listRepositories(): Promise<Repository[]> {
  return simulate(() => requireDb().connections.filter((c) => c.status === 'connected').flatMap((c) => c.repositories), { ms: 250 });
}
