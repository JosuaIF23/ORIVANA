import type { CreateMemoryRequest, Memory, MemoryListQuery, MemoryListResponse, MemoryStatus, UpdateMemoryRequest } from '@contracts/types';
import { nowIso } from '@/lib/clock';
import { fixtures } from './core/fixtures';
import { fail, failWith, simulate } from './core/http';
import { recordAudit, requireDb } from './core/session';
import type { MockDb } from './core/store';

const ORDER: Record<MemoryStatus, number> = { candidate: 0, confirmed: 1, superseded: 2, rejected: 3 };

function counts(list: Memory[]): Record<MemoryStatus, number> {
  const c = { candidate: 0, confirmed: 0, superseded: 0, rejected: 0 };
  for (const m of list) c[m.status] += 1;
  return c;
}

/**
 * GET /api/v1/memories. `status=needs_review` returns candidates first, then
 * confirmed (UI.md §4.8 default view).
 */
export function listMemories(query: MemoryListQuery = {}): Promise<MemoryListResponse> {
  return simulate(() => {
    const db = requireDb();
    const source = query.decisions_only ? db.decisions : db.memories;
    const q = query.q?.trim().toLowerCase();
    const scoped = source
      .filter((m) => !query.project_id || m.project_id === query.project_id)
      .filter((m) => !query.memory_type || m.memory_type === query.memory_type)
      .filter((m) => !q || m.content.toLowerCase().includes(q));
    const items = scoped
      .filter((m) => {
        if (!query.status) return true;
        if (query.status === 'needs_review') return m.status === 'candidate' || m.status === 'confirmed';
        return m.status === query.status;
      })
      .toSorted((a, b) => ORDER[a.status] - ORDER[b.status] || b.updated_at.localeCompare(a.updated_at));
    return { items, next_cursor: null, total: items.length, counts: counts(scoped) };
  }, { ms: 360 });
}

function find(db: MockDb, id: string): Memory {
  const memory = db.memories.find((m) => m.id === id) ?? db.decisions.find((m) => m.id === id);
  if (!memory) failWith('NOT_FOUND', 'Memory not found.');
  return memory;
}

/** POST /api/v1/memories */
export function createMemory(request: CreateMemoryRequest): Promise<Memory> {
  return simulate(() => {
    const db = requireDb();
    if (!request.content.trim()) failWith('VALIDATION_FAILED', 'Write what ORIVANA should remember.', { field: 'content' });
    const project = db.projects.find((p) => p.id === request.project_id) ?? null;
    const template = structuredClone(fixtures.memories.list.items[4]);
    const memory: Memory = {
      ...template,
      id: `mem_live_${db.memories.length + 1}`,
      project_id: project?.id ?? null,
      project_name: project?.name ?? null,
      memory_type: request.memory_type,
      content: request.content.trim(),
      origin: 'user',
      status: 'confirmed',
      confidence: null,
      supersedes_id: null,
      superseded_by_id: null,
      created_at: nowIso(),
      updated_at: nowIso(),
      valid_from: nowIso(),
      valid_to: null,
      evidence: { kind: 'user', label: 'Added by you', conversation_id: null, source_id: null, page: null },
      decision: null,
    };
    db.memories.unshift(memory);
    recordAudit(db, { actor_type: 'user', category: 'memory', event_type: 'memory.created', target_type: 'memory', target_id: memory.id, summary: 'Added memory {link}', link: { label: memory.content, target_type: 'memory', target_id: memory.id }, result: 'confirmed' });
    return memory;
  });
}

/** PATCH /api/v1/memories/{id} */
export function updateMemory(id: string, request: UpdateMemoryRequest): Promise<Memory> {
  return simulate(() => {
    const db = requireDb();
    const memory = find(db, id);
    const at = nowIso();
    switch (request.op) {
      case 'confirm':
        if (memory.status !== 'candidate') failWith('CONFLICT', 'Only candidates can be confirmed.');
        memory.status = 'confirmed';
        break;
      case 'reject':
        if (memory.status !== 'candidate') failWith('CONFLICT', 'Only candidates can be rejected.');
        memory.status = 'rejected';
        break;
      case 'edit':
        if (!request.content.trim()) failWith('VALIDATION_FAILED', 'Memory text can’t be empty.', { field: 'content' });
        memory.content = request.content.trim();
        if (request.memory_type) memory.memory_type = request.memory_type;
        if (memory.decision) memory.decision.title = memory.content;
        memory.origin = 'user';
        break;
      case 'supersede': {
        const replacement = db.memories.find((m) => m.id === request.superseded_by_id) ?? db.decisions.find((m) => m.id === request.superseded_by_id);
        if (!replacement || replacement.status !== 'confirmed' || replacement.id === id) fail(fixtures.memories.invalid);
        memory.status = 'superseded';
        memory.superseded_by_id = replacement.id;
        memory.valid_to = at;
        replacement.supersedes_id = memory.id;
        break;
      }
    }
    memory.updated_at = at;
    const verb = { confirm: 'Confirmed', reject: 'Rejected', edit: 'Edited', supersede: 'Marked superseded:' }[request.op];
    recordAudit(db, {
      actor_type: 'user',
      category: 'memory',
      event_type: `memory.${request.op}`,
      target_type: 'memory',
      target_id: id,
      summary: `${verb} memory {link}`,
      link: { label: memory.content.length > 48 ? `${memory.content.slice(0, 45)}…` : memory.content, target_type: 'memory', target_id: id },
      result: memory.status === 'rejected' ? 'rejected' : 'confirmed',
    });
    return memory;
  }, { ms: 420 });
}

/** DELETE /api/v1/memories/{id} */
export function deleteMemory(id: string): Promise<{ ok: true }> {
  return simulate(() => {
    const db = requireDb();
    const memory = find(db, id);
    db.memories = db.memories.filter((m) => m.id !== id);
    db.decisions = db.decisions.filter((m) => m.id !== id);
    for (const m of [...db.memories, ...db.decisions]) {
      if (m.superseded_by_id === id) m.superseded_by_id = null;
      if (m.supersedes_id === id) m.supersedes_id = null;
    }
    recordAudit(db, { actor_type: 'user', category: 'memory', event_type: 'memory.deleted', target_type: 'memory', target_id: id, summary: `Deleted memory “${memory.content.slice(0, 40)}”`, link: null, result: 'succeeded' });
    return { ok: true as const };
  }, { ms: 380 });
}

/** DELETE /api/v1/memories?status=candidate (extension) */
export function deleteCandidateMemories(): Promise<{ deleted: number }> {
  return simulate(() => {
    const db = requireDb();
    const before = db.memories.length;
    db.memories = db.memories.filter((m) => m.status !== 'candidate');
    return { deleted: before - db.memories.length };
  }, { ms: 500 });
}
