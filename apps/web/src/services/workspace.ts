import type { DataExport, DeletionPreview, ExportsResponse, SuggestionsResponse } from '@contracts/types';
import { nowIso } from '@/lib/clock';
import { fixtures } from './core/fixtures';
import { delay, fail, simulate } from './core/http';
import { recordAudit, requireDb } from './core/session';
import { endSession } from './core/store';

/** GET /api/v1/home/suggestions (extension) */
export function getSuggestions(): Promise<SuggestionsResponse> {
  return simulate(() => {
    const db = requireDb();
    if (db.scenario === 'new_user') return { basis: fixtures.home.suggestions.basis, items: [] };
    const candidates = db.relationships.filter((r) => r.status === 'candidate').length;
    const memories = db.memories.filter((m) => m.status === 'candidate').length;
    return {
      basis: fixtures.home.suggestions.basis,
      items: fixtures.home.suggestions.items
        .map((s) => {
          if (s.target.kind === 'graph_candidates') return candidates ? { ...s, text: s.text.replace(/\d+/, String(candidates)) } : null;
          if (s.target.kind === 'memory_review') return memories ? { ...s, text: s.text.replace(/\d+/, String(memories)) } : null;
          return s;
        })
        .filter((s): s is NonNullable<typeof s> => s !== null),
    };
  }, { ms: 280 });
}

/** GET /api/v1/exports (extension) */
export function getExports(): Promise<ExportsResponse> {
  return simulate(() => {
    const db = requireDb();
    return { latest: db.latestExport, included: db.exportIncluded };
  }, { ms: 250 });
}

/** POST /api/v1/exports — becomes ready a few seconds later. */
export function startExport(): Promise<DataExport> {
  return simulate(() => {
    const db = requireDb();
    const created: DataExport = { ...structuredClone(fixtures.exports.create), created_at: nowIso() };
    db.latestExport = created;
    void (async () => {
      await delay(1500);
      created.status = 'running';
      await delay(2500);
      Object.assign(created, { ...fixtures.exports.ready, created_at: created.created_at, expires_at: new Date(Date.now() + 7 * 86_400_000).toISOString() });
    })();
    return created;
  }, { ms: 500 });
}

/** GET /api/v1/workspaces/{id}/deletion-preview (extension) */
export function getDeletionPreview(): Promise<DeletionPreview> {
  return simulate(() => {
    const db = requireDb();
    return { ...fixtures.workspace.deletionPreview, workspace_id: db.me.workspace.id, workspace_name: db.me.workspace.name };
  }, { ms: 350 });
}

/** DELETE /api/v1/workspaces/{id}/data (extension) */
export function deleteWorkspaceData(confirmName: string): Promise<{ ok: true }> {
  return simulate(() => {
    const db = requireDb();
    if (confirmName.trim() !== db.me.workspace.name) fail(fixtures.workspace.deleteConfirmation);
    recordAudit(db, { actor_type: 'user', category: 'ingestion', event_type: 'workspace.data_deleted', target_type: 'workspace', target_id: db.me.workspace.id, summary: 'Deleted all workspace data', link: null, result: 'succeeded' });
    const audit = db.audit.map((e) => ({ ...e, summary: e.event_type, link: null, metadata: {} }));
    Object.assign(db, { sources: [], recentSourceIds: [], conversations: [], entities: [], relationships: [], memories: [], decisions: [], projects: [], audit });
    db.proposals = db.proposals.filter((p) => !['awaiting_approval', 'draft'].includes(p.status));
    db.connections = [];
    db.scenario = 'new_user';
    return { ok: true as const };
  }, { ms: 1200 });
}

export { endSession };
