/**
 * Zotero connector (read only, PRD §8.2). ORIVANA imports items, PDFs, and
 * highlights from chosen collections and never writes back to Zotero.
 */
import type { SourceDetail, ToolConnection, ZoteroCollectionsResponse, ZoteroSyncRequest, ZoteroSyncResponse } from '@contracts/types';
import { nowIso } from '@/lib/clock';
import { fixtures } from './core/fixtures';
import { delay, fail, failWith, simulate } from './core/http';
import { recordAudit, requireDb } from './core/session';
import type { MockDb } from './core/store';
import { runIngestion } from './sources';

function zoteroConnection(db: MockDb): ToolConnection | undefined {
  return db.connections.find((c) => c.provider === 'zotero' && c.status !== 'revoked');
}

/**
 * POST /api/v1/connections {provider: zotero} then the callback. The prototype
 * skips the zotero.org consent page and completes the round trip.
 */
export function connectZotero(): Promise<ToolConnection> {
  return simulate(() => {
    const db = requireDb();
    const at = nowIso();
    const connection: ToolConnection = { ...structuredClone(fixtures.zotero.callback), workspace_id: db.me.workspace.id, connected_at: at, last_checked_at: at, last_sync_at: at, collections: [] };
    const existing = db.connections.find((c) => c.provider === 'zotero');
    if (existing) Object.assign(existing, connection);
    else db.connections.unshift(connection);
    recordAudit(db, { actor_type: 'user', category: 'zotero_sync', event_type: 'connection.created', target_type: 'connection', target_id: connection.id, summary: 'Connected Zotero (read only) as {link}', link: { label: connection.account_label, target_type: 'zotero_collection', target_id: connection.id }, result: 'succeeded' });
    return existing ?? connection;
  }, { ms: 1100 });
}

/** GET /api/v1/connections/zotero/collections */
export function listZoteroCollections(): Promise<ZoteroCollectionsResponse> {
  return simulate(() => {
    const db = requireDb();
    if (!zoteroConnection(db)) failWith('CONNECTION_NEEDS_RECONNECT', 'Connect Zotero to choose collections.');
    return { library_label: fixtures.zotero.collections.library_label, collections: db.zoteroCollections };
  }, { ms: 420 });
}

/** Builds sources for a collection that hasn't been imported yet (the mock "new" items). */
function newSources(db: MockDb, keys: string[], projectId: string | null, syncId: string): SourceDetail[] {
  const project = db.projects.find((p) => p.id === projectId) ?? null;
  const template = fixtures.sources.list.items.find((s) => s.id === 'src_varga2024')!;
  const titles: Record<string, string[]> = {
    ZC7K2MHP: ['Iterative Retrieval for Multi-hop QA', 'Decomposed Questions for HotpotQA', 'Bridge Entities in Multi-hop Retrieval', 'Chain-of-Retrieval Baselines'],
    ZC9T4THS: ['Graph Neural Rerankers', 'Citation Graphs for Literature Review', 'Knowledge-Graph RAG Survey'],
    ZC3R8RDG: ['Evaluating Faithfulness in RAG', 'Query Expansion with LLMs'],
  };
  return keys.flatMap((key) => {
    const collection = db.zoteroCollections.find((c) => c.key === key)!;
    return (titles[key] ?? []).map((title, i) => {
      const id = `src_z_${key.slice(-3).toLowerCase()}_${i + 1}`;
      const source: SourceDetail = {
        ...structuredClone(template),
        id,
        title,
        file_name: `${title}.pdf`,
        authors: null,
        short_label: title,
        year: 2025,
        project_id: project?.id ?? null,
        project_name: project?.name ?? null,
        status: 'queued',
        page_count: 10 + i,
        section_count: null,
        chunk_count: null,
        created_at: nowIso(),
        updated_at: nowIso(),
        job: { ...structuredClone(template.job!), id: `job_${syncId.slice(-4)}_${i}`, source_id: id, status: 'queued', stage: 'queued', attempts: 1, started_at: null, finished_at: null, progress: null },
        zotero: { library_id: template.zotero!.library_id, item_key: `NEW${key.slice(-3)}${i}`, item_version: 500 + i, collection_key: key, collection_name: collection.name, last_synced_at: nowIso(), has_pdf: true, annotation_count: 0, removed_in_zotero: false },
        sections: [],
        entities: [],
        entity_count: 0,
        relationships: [],
        relationship_count: 0,
        ingestion_history: [],
        suggested_questions: [],
      };
      return source;
    });
  });
}

/** POST /api/v1/connections/zotero/sync — imports or syncs the chosen collections. */
export function syncZotero(request: ZoteroSyncRequest): Promise<ZoteroSyncResponse> {
  return simulate(() => {
    const db = requireDb();
    const connection = zoteroConnection(db);
    if (!connection) failWith('CONNECTION_NEEDS_RECONNECT', 'Connect Zotero to import collections.');
    if (!request.collection_keys.length) failWith('VALIDATION_FAILED', 'Choose at least one collection.', { field: 'collection_keys' });
    if (db.zoteroSyncs.some((s) => s.status === 'running' || s.status === 'queued')) fail(fixtures.zotero.syncRunning);
    const chosen = db.zoteroCollections.filter((c) => request.collection_keys.includes(c.key));
    const fresh = chosen.filter((c) => !c.synced_project_id).map((c) => c.key);
    const syncId = `zsync_${String(db.zoteroSyncs.length + 1).padStart(3, '0')}`;
    const created = newSources(db, fresh, request.project_id, syncId);
    const existing = db.sources.filter((s) => s.zotero && request.collection_keys.includes(s.zotero.collection_key));
    const sync: ZoteroSyncResponse = {
      sync_id: syncId,
      status: 'running',
      project_id: request.project_id,
      collection_keys: request.collection_keys,
      counts: {
        items: chosen.reduce((n, c) => n + c.item_count, 0),
        with_pdf: chosen.reduce((n, c) => n + c.pdf_count, 0),
        new: created.length,
        updated: 0,
        unchanged: existing.filter((s) => !s.zotero?.removed_in_zotero).length,
        removed: existing.filter((s) => s.zotero?.removed_in_zotero).length,
      },
      items: [
        ...created.map((s) => ({ item_key: s.zotero!.item_key, title: s.title, source_id: s.id, state: 'new' as const })),
        ...existing.map((s) => ({ item_key: s.zotero!.item_key, title: s.title, source_id: s.id, state: s.zotero!.removed_in_zotero ? ('removed' as const) : ('unchanged' as const) })),
      ],
      started_at: nowIso(),
      finished_at: null,
    };
    db.zoteroSyncs.unshift(sync);
    void (async () => {
      for (const source of created) {
        await delay(400);
        db.sources.unshift(source);
        db.recentSourceIds.unshift(source.id);
        void runIngestion(db, source);
      }
      await delay(600);
      const at = nowIso();
      for (const c of chosen) Object.assign(c, { synced_project_id: c.synced_project_id ?? request.project_id, last_synced_at: at });
      connection.last_sync_at = at;
      connection.collections = db.zoteroCollections.filter((c) => c.synced_project_id).map(({ key, name, item_count }) => ({ key, name, item_count }));
      const project = db.projects.find((p) => p.id === request.project_id);
      if (project) project.counts.sources += created.length;
      Object.assign(sync, { status: 'succeeded', finished_at: at });
      recordAudit(db, {
        actor_type: 'system',
        category: 'zotero_sync',
        event_type: 'zotero.sync_completed',
        target_type: 'zotero_collection',
        target_id: chosen[0].key,
        summary: `Synced ${chosen.length === 1 ? 'Zotero collection {link}' : `${chosen.length} Zotero collections, including {link}`}: ${created.length} new item${created.length === 1 ? '' : 's'}`,
        link: { label: chosen[0].name, target_type: 'zotero_collection', target_id: chosen[0].key },
        result: 'succeeded',
      });
    })();
    return sync;
  }, { ms: 700 });
}

/** GET /api/v1/connections/zotero/sync/{id} (extension) — polled by the import dialog. */
export function getZoteroSync(id: string): Promise<ZoteroSyncResponse> {
  return simulate(() => {
    const sync = requireDb().zoteroSyncs.find((s) => s.sync_id === id);
    if (!sync) failWith('NOT_FOUND', 'Sync not found.');
    return sync;
  }, { ms: 200 });
}
