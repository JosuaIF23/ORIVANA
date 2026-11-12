import type { AuditEvent } from '@contracts/types';
import { nowIso } from '@/lib/clock';
import { fail, nextRequestId } from './http';
import { fixtures } from './fixtures';
import { currentDb, type MockDb } from './store';

/** Every authenticated endpoint starts here; signed-out calls get 401. */
export function requireDb(): MockDb {
  const db = currentDb();
  if (!db) fail(fixtures.me.unauthenticated);
  return db;
}

let auditSeq = 0;

/** Appends an audit event, as the backend does for every write (PRD §13). */
export function recordAudit(db: MockDb, event: Omit<AuditEvent, 'id' | 'workspace_id' | 'request_id' | 'created_at' | 'metadata' | 'actor_id'> & Partial<Pick<AuditEvent, 'metadata'>>): AuditEvent {
  auditSeq += 1;
  const full: AuditEvent = {
    id: `evt_live${String(auditSeq).padStart(3, '0')}`,
    workspace_id: db.me.workspace.id,
    actor_id: event.actor_type === 'user' ? db.me.user.id : event.actor_type === 'agent' ? 'agent_orivana' : 'system',
    request_id: nextRequestId(),
    created_at: nowIso(),
    metadata: {},
    ...event,
  };
  db.audit.unshift(full);
  return full;
}
