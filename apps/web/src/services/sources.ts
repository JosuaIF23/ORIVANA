import type {
  DeleteSourceResponse,
  Job,
  Source,
  SourceDetail,
  SourceListQuery,
  SourceListResponse,
  SourcePageResponse,
  UploadSourceRequest,
  UploadSourceResponse,
} from '@contracts/types';
import { nowIso } from '@/lib/clock';
import { fixtures, loadSourcePages } from './core/fixtures';
import { delay, fail, failWith, simulate } from './core/http';
import { recordAudit, requireDb } from './core/session';
import type { MockDb } from './core/store';

export const SOURCES_PAGE_SIZE = 8;
const MAX_UPLOAD_BYTES = 50 * 1024 * 1024;

function summary(s: SourceDetail): Source {
  const { sections: _a, entities: _b, entity_count: _c, relationships: _d, relationship_count: _e, ingestion_history: _f, ...rest } = s;
  return rest;
}

/** GET /api/v1/sources */
export function listSources(query: SourceListQuery = {}): Promise<SourceListResponse> {
  return simulate(() => {
    const db = requireDb();
    const q = query.q?.trim().toLowerCase();
    const filtered = db.sources
      .filter((s) => !query.project_id || s.project_id === query.project_id)
      .filter((s) => !query.status || s.status === query.status)
      .filter((s) => !query.type || s.type === query.type)
      .filter((s) => !query.removed_in_zotero || Boolean(s.zotero?.removed_in_zotero))
      .filter((s) => !q || [s.title, s.authors ?? '', s.file_name].some((v) => v.toLowerCase().includes(q)))
      .toSorted((a, b) => b.created_at.localeCompare(a.created_at));
    const offset = query.cursor ? Number(query.cursor) : 0;
    const limit = query.limit ?? SOURCES_PAGE_SIZE;
    const items = filtered.slice(offset, offset + limit).map(summary);
    return {
      items,
      next_cursor: offset + limit < filtered.length ? String(offset + limit) : null,
      total: filtered.length,
      workspace_total: db.sources.length,
    };
  }, { ms: 340 });
}

/** GET /api/v1/sources?view=home&limit=4 */
export function listRecentSources(): Promise<Source[]> {
  return simulate(() => {
    const db = requireDb();
    return db.recentSourceIds
      .map((id) => db.sources.find((s) => s.id === id))
      .filter((s): s is SourceDetail => Boolean(s))
      .slice(0, 4)
      .map(summary);
  }, { ms: 280 });
}

/** GET /api/v1/sources/{id} */
export function getSource(id: string): Promise<SourceDetail> {
  return simulate(() => {
    const source = requireDb().sources.find((s) => s.id === id);
    if (!source) fail(fixtures.sources.notFound);
    return source;
  }, { ms: 300 });
}

/** GET /api/v1/sources/{id}/chunks?page=N */
export async function getSourcePage(id: string, page: number): Promise<SourcePageResponse | null> {
  const source = await getSource(id);
  if (source.status === 'queued' || source.status === 'parsing') {
    failWith('SOURCE_PROCESSING', `${source.title} is still being processed. Its pages open once parsing finishes.`, { status: source.status });
  }
  if (source.status === 'failed') {
    failWith('SOURCE_PROCESSING', 'This source failed to parse, so there are no pages to show.', { status: source.status });
  }
  const pages = await loadSourcePages(id);
  if (!pages) return null;
  const clamped = Math.min(Math.max(1, page), pages.length);
  return structuredClone(pages[clamped - 1]);
}

// --- Ingestion simulation ------------------------------------------------------

function patchJob(source: SourceDetail, patch: Partial<Job>) {
  if (!source.job) return;
  Object.assign(source.job, patch);
  source.status = source.job.stage;
  source.updated_at = nowIso();
}

/** Moves a job through queued → parsing → indexing → extracting → ready in the background. */
export async function runIngestion(db: MockDb, source: SourceDetail, opts: { failWith?: { code: string; message: string }; chunks?: number } = {}) {
  const pages = source.page_count ?? 12;
  const chunks = opts.chunks ?? Math.round(pages * 6.2);
  await delay(900);
  patchJob(source, { status: 'running', stage: 'parsing', started_at: nowIso(), progress: { current: 0, total: pages, unit: 'pages' }, eta_seconds: 40 });
  source.ingestion_history = [{ label: 'Uploaded & checksum verified', status: 'done', at: nowIso() }];
  for (let p = 1; p <= pages; p += Math.ceil(pages / 4)) {
    await delay(500);
    patchJob(source, { progress: { current: p, total: pages, unit: 'pages' } });
  }
  if (opts.failWith) {
    await delay(500);
    patchJob(source, { status: 'failed', stage: 'failed', error_code: opts.failWith.code, error_message: opts.failWith.message, finished_at: nowIso(), progress: null });
    source.ingestion_history.push({ label: `Attempt ${source.job?.attempts} failed · password-protected PDF`, status: 'failed', at: nowIso() });
    recordAudit(db, { actor_type: 'system', category: 'errors', event_type: 'ingestion.failed', target_type: 'source', target_id: source.id, summary: 'Parsing failed for {link}', link: { label: source.title, target_type: 'source', target_id: source.id }, result: 'failed', metadata: { error_code: opts.failWith.code, error_message: opts.failWith.message, job: `${source.job?.id} · parse · attempt ${source.job?.attempts} of ${source.job?.max_attempts}` } });
    return;
  }
  source.ingestion_history.push({ label: `Parsed · ${pages} pages`, status: 'done', at: nowIso() });
  patchJob(source, { stage: 'indexing', progress: { current: 0, total: chunks, unit: 'chunks' }, eta_seconds: 30 });
  source.page_count = pages;
  for (let c = 0; c <= chunks; c += Math.ceil(chunks / 5)) {
    await delay(600);
    patchJob(source, { progress: { current: Math.min(c, chunks), total: chunks, unit: 'chunks' }, eta_seconds: Math.max(5, Math.round(((chunks - c) / chunks) * 30)) });
  }
  source.ingestion_history.push({ label: `Chunked & embedded · ${chunks} chunks`, status: 'done', at: nowIso() });
  patchJob(source, { stage: 'extracting', progress: null, eta_seconds: 10 });
  await delay(800);
  patchJob(source, { status: 'succeeded', stage: 'ready', finished_at: nowIso(), progress: { current: chunks, total: chunks, unit: 'chunks' }, eta_seconds: null });
  source.chunk_count = chunks;
  source.section_count = source.sections.length || 10;
  source.ingestion_history.push({ label: 'Entities extracted', status: 'done', at: nowIso() });
  recordAudit(db, { actor_type: 'system', category: 'ingestion', event_type: 'ingestion.completed', target_type: 'source', target_id: source.id, summary: 'Finished indexing {link}', link: { label: source.title, target_type: 'source', target_id: source.id }, result: 'ready' });
}

/** POST /api/v1/sources (multipart upload) */
export function uploadSource(request: UploadSourceRequest): Promise<UploadSourceResponse> {
  return simulate(() => {
    const db = requireDb();
    if (request.size_bytes > MAX_UPLOAD_BYTES) fail(fixtures.sources.uploadTooLarge);
    const ext = request.file_name.split('.').pop()?.toLowerCase();
    if (!['pdf', 'md', 'markdown', 'txt'].includes(ext ?? '')) {
      failWith('VALIDATION_FAILED', 'Upload a PDF, Markdown, or TXT file.', { field: 'file' });
    }
    const template = structuredClone(fixtures.sources.upload);
    const known = Object.values(fixtures.sources.detail.items).find((s) => s.file_name === request.file_name);
    const project = db.projects.find((p) => p.id === request.project_id) ?? null;
    const id = known && !db.sources.some((s) => s.id === known.id) ? known.id : `src_up_${db.sources.length + 1}`;
    const job: Job = { ...template.job, id: `job_up_${db.sources.length + 1}`, workspace_id: db.me.workspace.id, source_id: id, started_at: null };
    const base = known ? structuredClone(known) : null;
    const source: SourceDetail = {
      ...(base ?? {
        ...template.source,
        title: request.file_name.replace(/\.(pdf|md|markdown|txt)$/i, ''),
        file_name: request.file_name,
        authors: null,
        short_label: request.file_name,
        year: null,
        sections: [],
        entities: [],
        entity_count: 0,
        relationships: [],
        relationship_count: 0,
        suggested_questions: [],
        type: ext === 'pdf' ? 'pdf' : ext === 'txt' ? 'txt' : 'markdown',
        page_count: ext === 'pdf' ? 12 : null,
      }),
      id,
      workspace_id: db.me.workspace.id,
      project_id: project?.id ?? null,
      project_name: project?.name ?? null,
      size_bytes: request.size_bytes,
      status: 'queued',
      chunk_count: null,
      created_at: nowIso(),
      updated_at: nowIso(),
      ingestion_history: [],
      job,
    };
    db.sources.unshift(source);
    db.recentSourceIds.unshift(source.id);
    if (project) project.counts.sources += 1;
    recordAudit(db, { actor_type: 'user', category: 'ingestion', event_type: 'source.uploaded', target_type: 'source', target_id: id, summary: 'Uploaded {link}', link: { label: source.title, target_type: 'source', target_id: id }, result: 'in_progress' });
    void runIngestion(db, source, { chunks: base?.chunk_count ?? undefined });
    return { source: summary(source), job };
  }, { ms: 800 });
}

/** POST /api/v1/sources/{id}/reprocess */
export function reprocessSource(id: string): Promise<Job> {
  return simulate(() => {
    const db = requireDb();
    const source = db.sources.find((s) => s.id === id);
    if (!source?.job) fail(fixtures.sources.notFound);
    if (source.job.attempts >= source.job.max_attempts) {
      failWith('CONFLICT', 'All 3 attempts were used. Remove the password and upload the file again.', { attempts: source.job.attempts });
    }
    const encrypted = source.job.error_code === 'PDF_ENCRYPTED';
    patchJob(source, { status: 'queued', stage: 'queued', attempts: source.job.attempts + 1, error_code: null, error_message: null, finished_at: null });
    const message = 'Parsing failed: the PDF is password-protected. Remove the password and re-upload, or retry if you already did.';
    void runIngestion(db, source, encrypted ? { failWith: { code: 'PDF_ENCRYPTED', message } } : {});
    return source.job;
  });
}

/** DELETE /api/v1/sources/{id} — removes derived data per PRD §10 deletion policy. */
export function deleteSource(id: string): Promise<DeleteSourceResponse> {
  return simulate(() => {
    const db = requireDb();
    const source = db.sources.find((s) => s.id === id);
    if (!source) fail(fixtures.sources.notFound);
    let citations = 0;
    for (const conversation of db.conversations) {
      for (const message of conversation.messages) {
        const before = message.citations.length;
        message.citations = message.citations.filter((c) => c.source_id !== id);
        citations += before - message.citations.length;
      }
    }
    let evidence = 0;
    let orphaned = 0;
    for (const rel of db.relationships) {
      const before = rel.evidence.length;
      rel.evidence = rel.evidence.filter((e) => e.source_id !== id);
      evidence += before - rel.evidence.length;
      rel.evidence_count = rel.evidence.length;
      if (before > 0 && rel.evidence.length === 0) orphaned += 1;
    }
    const memories = db.memories.filter((m) => m.evidence.source_id === id).length;
    // v2: remove the source from Claims and Matrix evidence too (PRD §12.4).
    for (const claim of db.claims) claim.evidence = claim.evidence.filter((e) => e.source_id !== id);
    for (const cell of db.matrixCells) {
      cell.papers = cell.papers.filter((p) => p.source_id !== id);
      cell.is_gap = cell.papers.length === 0;
    }
    db.sources = db.sources.filter((s) => s.id !== id);
    db.recentSourceIds = db.recentSourceIds.filter((x) => x !== id);
    recordAudit(db, { actor_type: 'user', category: 'ingestion', event_type: 'source.deleted', target_type: 'source', target_id: id, summary: `Deleted ${source.title} and its derived data`, link: null, result: 'succeeded' });
    return {
      deleted_source_id: id,
      removed: { chunks: source.chunk_count ?? 0, citations, evidence_links: evidence },
      needs_review: { relationships: orphaned, memories },
    };
  }, { ms: 700 });
}

/** True while any visible source is still processing (drives polling). */
export function isProcessing(sources: Pick<Source, 'status'>[]): boolean {
  return sources.some((s) => s.status === 'queued' || s.status === 'parsing' || s.status === 'indexing' || s.status === 'extracting');
}

/** Extension: PATCH /api/v1/sources/{id} — "Keep" a source that was removed in Zotero. */
export function keepRemovedZoteroItem(id: string): Promise<Source> {
  return simulate(() => {
    const db = requireDb();
    const source = db.sources.find((s) => s.id === id);
    if (!source) fail(fixtures.sources.notFound);
    if (!source.zotero?.removed_in_zotero) failWith('CONFLICT', 'This source is still in your Zotero library.');
    // The item stays in ORIVANA as a local copy; it no longer syncs.
    source.zotero = { ...source.zotero, removed_in_zotero: false, collection_name: `${source.zotero.collection_name} (kept after removal)` };
    source.updated_at = nowIso();
    recordAudit(db, { actor_type: 'user', category: 'zotero_sync', event_type: 'zotero.removed_item_kept', target_type: 'source', target_id: id, summary: 'Kept {link} after it was removed in Zotero', link: { label: source.title, target_type: 'source', target_id: id }, result: 'confirmed' });
    return summary(source);
  }, { ms: 420 });
}
