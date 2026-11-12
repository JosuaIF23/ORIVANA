import type { CreateMemoryRequest, DecisionDependency, Memory, MemoryListQuery, MemoryListResponse, MemoryStatus, UpdateMemoryRequest } from '@contracts/types';
import { nowIso } from '@/lib/clock';
import { fixtures } from './core/fixtures';
import { fail, failWith, simulate } from './core/http';
import { recordAudit, requireDb } from './core/session';
import type { MockDb } from './core/store';

const ORDER: Record<MemoryStatus, number> = { candidate: 0, proposed: 0, confirmed: 1, superseded: 2, rejected: 3 };
const REVIEWABLE: MemoryStatus[] = ['candidate', 'proposed'];

function counts(list: Memory[]): Record<MemoryStatus, number> {
  const c: Record<MemoryStatus, number> = { candidate: 0, proposed: 0, confirmed: 0, superseded: 0, rejected: 0 };
  for (const m of list) c[m.status] += 1;
  return c;
}

/**
 * GET /api/v1/memories. `status=needs_review` keeps its v1 meaning (candidates
 * first, then confirmed). v2 adds `review_state` and `kind`; decisions that
 * need review sort first (UI.md §4.10).
 */
export function listMemories(query: MemoryListQuery = {}): Promise<MemoryListResponse> {
  return simulate(() => {
    const db = requireDb();
    const source = query.decisions_only || query.kind === 'decision' ? db.decisions : query.kind ? db.memories.filter((m) => m.kind === query.kind) : db.memories;
    const q = query.q?.trim().toLowerCase();
    const scoped = source
      .filter((m) => !query.project_id || m.project_id === query.project_id)
      .filter((m) => !query.memory_type || m.memory_type === query.memory_type)
      .filter((m) => !q || [m.content, m.title ?? '', m.rationale ?? ''].some((v) => v.toLowerCase().includes(q)));
    const items = scoped
      .filter((m) => !query.review_state || (m.review_state ?? 'ok') === query.review_state)
      .filter((m) => {
        if (!query.status) return true;
        if (query.status === 'needs_review') return REVIEWABLE.includes(m.status) || m.status === 'confirmed';
        return m.status === query.status;
      })
      .toSorted((a, b) => Number(b.review_state === 'needs_review') - Number(a.review_state === 'needs_review') || ORDER[a.status] - ORDER[b.status] || b.updated_at.localeCompare(a.updated_at));
    return { items, next_cursor: null, total: items.length, counts: counts(scoped) };
  }, { ms: 360 });
}

function find(db: MockDb, id: string): Memory {
  const memory = db.memories.find((m) => m.id === id) ?? db.decisions.find((m) => m.id === id);
  if (!memory) failWith('NOT_FOUND', 'Memory not found.');
  return memory;
}

/** GET /api/v1/memories/{id} */
export function getMemory(id: string): Promise<Memory> {
  return simulate(() => find(requireDb(), id), { ms: 280 });
}

function dependenciesFor(db: MockDb, claimIds: string[]): DecisionDependency[] {
  return claimIds.map((id) => {
    const claim = db.claims.find((c) => c.id === id);
    if (!claim) failWith('VALIDATION_FAILED', 'One of the claims no longer exists.', { field: 'dependencies', claim_id: id });
    const count = (stance: string) => new Set(claim.evidence.filter((e) => e.stance === stance && e.status !== 'rejected').map((e) => e.source_id)).size;
    return { claim_id: id, statement: claim.statement, supports_count: count('supports'), contradicts_count: count('contradicts'), note: null };
  });
}

function nextDecisionCode(db: MockDb, projectId: string | null): string {
  const codes = db.decisions.filter((d) => d.project_id === projectId).map((d) => Number(d.decision?.code.replace('D-', '') ?? 0));
  return `D-${String(Math.max(0, ...codes) + 1).padStart(2, '0')}`;
}

function linkClaims(db: MockDb, decision: Memory) {
  for (const claim of db.claims) {
    const uses = decision.dependencies?.some((d) => d.claim_id === claim.id) ?? false;
    const listed = claim.used_by_decisions.some((d) => d.id === decision.id);
    if (uses && !listed) claim.used_by_decisions.push({ id: decision.id, code: decision.decision?.code ?? null, title: decision.title ?? decision.content, review_state: decision.review_state ?? 'ok' });
    if (!uses && listed) claim.used_by_decisions = claim.used_by_decisions.filter((d) => d.id !== decision.id);
  }
}

function createDecision(db: MockDb, request: CreateMemoryRequest): Memory {
  const title = request.title?.trim() ?? '';
  if (!title) failWith('VALIDATION_FAILED', 'Give the decision a short title.', { field: 'title' });
  const status = request.status ?? 'proposed';
  const dependencies = dependenciesFor(db, request.dependencies ?? []);
  const evidence = request.evidence ?? [];
  if (status === 'confirmed' && !evidence.length && !dependencies.length) {
    failWith('VALIDATION_FAILED', 'Link at least one piece of evidence or claim before confirming.', { field: 'evidence' });
  }
  const project = db.projects.find((p) => p.id === request.project_id) ?? null;
  const at = nowIso();
  const code = nextDecisionCode(db, project?.id ?? null);
  const first = evidence[0];
  const decision: Memory = {
    id: `dec_live_${db.decisions.length + 1}`,
    workspace_id: db.me.workspace.id,
    project_id: project?.id ?? null,
    project_name: project?.name ?? null,
    memory_type: 'project',
    content: request.content.trim() || title,
    origin: 'user',
    status,
    confidence: null,
    supersedes_id: request.supersedes_id ?? null,
    superseded_by_id: null,
    valid_from: at,
    valid_to: null,
    created_at: at,
    updated_at: at,
    evidence: first ? { kind: 'source', label: `${first.label} · p. ${first.page}`, conversation_id: null, source_id: first.source_id, page: first.page } : { kind: 'user', label: 'Added by you', conversation_id: null, source_id: null, page: null },
    decision: { code, title, rationale: request.rationale?.trim() || null, evidence },
    kind: 'decision',
    title,
    rationale: request.rationale?.trim() || null,
    review_state: 'ok',
    dependencies,
    decided_at: status === 'confirmed' ? at : null,
    history: [{ at, kind: 'created', text: request.from_message_id ? 'Saved from an Assistant answer' : 'Recorded by you', link: null }],
    open_alert_id: null,
  };
  if (status === 'confirmed') decision.history!.push({ at, kind: 'confirmed', text: 'Confirmed by you', link: null });
  if (request.supersedes_id) {
    const old = db.decisions.find((d) => d.id === request.supersedes_id);
    if (!old) failWith('VALIDATION_FAILED', 'The decision you are revising no longer exists.', { field: 'supersedes_id' });
    old.status = 'superseded';
    old.superseded_by_id = decision.id;
    old.valid_to = at;
    old.updated_at = at;
    old.history = [...(old.history ?? []), { at, kind: 'superseded', text: `Superseded by ${code}`, link: { target_type: 'memory', target_id: decision.id } }];
    decision.history!.push({ at, kind: 'superseded', text: `Replaces ${old.decision?.code ?? 'an earlier decision'}`, link: { target_type: 'memory', target_id: old.id } });
  }
  db.decisions.unshift(decision);
  linkClaims(db, decision);
  if (project) project.counts.decisions += 1;
  recordAudit(db, { actor_type: 'user', category: 'memory', event_type: 'decision.created', target_type: 'memory', target_id: decision.id, summary: `Recorded ${status} decision {link}`, link: { label: `${code} ${title}`, target_type: 'memory', target_id: decision.id }, result: status === 'confirmed' ? 'confirmed' : 'candidate' });
  return decision;
}

/** POST /api/v1/memories (v2: decisions via kind = decision) */
export function createMemory(request: CreateMemoryRequest): Promise<Memory> {
  return simulate(() => {
    const db = requireDb();
    if (request.kind === 'decision') return createDecision(db, request);
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

/** PUT /api/v1/memories/{id}/dependencies */
export function setDependencies(id: string, claimIds: string[]): Promise<Memory> {
  return simulate(() => {
    const db = requireDb();
    const memory = find(db, id);
    if (memory.kind !== 'decision' && !memory.decision) failWith('VALIDATION_FAILED', 'Only decisions have claim dependencies.');
    memory.dependencies = dependenciesFor(db, [...new Set(claimIds)]);
    memory.updated_at = nowIso();
    memory.history = [...(memory.history ?? []), { at: nowIso(), kind: 'dependencies_changed', text: `Linked to ${memory.dependencies.length} claim${memory.dependencies.length === 1 ? '' : 's'}`, link: null }];
    linkClaims(db, memory);
    return memory;
  }, { ms: 380 });
}

/** PATCH /api/v1/memories/{id} */
export function updateMemory(id: string, request: UpdateMemoryRequest): Promise<Memory> {
  return simulate(() => {
    const db = requireDb();
    const memory = find(db, id);
    const at = nowIso();
    const isDecision = memory.kind === 'decision' || Boolean(memory.decision);
    switch (request.op) {
      case 'confirm':
        if (!REVIEWABLE.includes(memory.status)) failWith('CONFLICT', 'Only candidates can be confirmed.');
        if (isDecision && !memory.decision?.evidence.length && !memory.dependencies?.length) {
          failWith('VALIDATION_FAILED', 'Link at least one piece of evidence or claim before confirming.', { field: 'evidence' });
        }
        memory.status = 'confirmed';
        if (isDecision) {
          memory.decided_at = at;
          memory.history = [...(memory.history ?? []), { at, kind: 'confirmed', text: 'Confirmed by you', link: null }];
        }
        break;
      case 'reject':
        if (!REVIEWABLE.includes(memory.status)) failWith('CONFLICT', 'Only candidates can be rejected.');
        memory.status = 'rejected';
        break;
      case 'edit':
        if (!request.content.trim()) failWith('VALIDATION_FAILED', 'Memory text can’t be empty.', { field: 'content' });
        if (request.memory_type) memory.memory_type = request.memory_type;
        if (isDecision) {
          // For decisions the edit changes the title; the statement keeps its own text.
          memory.title = request.content.trim();
          if (memory.decision) memory.decision.title = memory.title;
          memory.history = [...(memory.history ?? []), { at, kind: 'edited', text: 'Edited by you', link: null }];
        } else {
          memory.content = request.content.trim();
        }
        memory.origin = 'user';
        break;
      case 'supersede': {
        const replacement = db.memories.find((m) => m.id === request.superseded_by_id) ?? db.decisions.find((m) => m.id === request.superseded_by_id);
        if (!replacement || replacement.status !== 'confirmed' || replacement.id === id) fail(fixtures.memories.invalid);
        memory.status = 'superseded';
        memory.superseded_by_id = replacement.id;
        memory.valid_to = at;
        replacement.supersedes_id = memory.id;
        if (isDecision) memory.history = [...(memory.history ?? []), { at, kind: 'superseded', text: `Superseded by ${replacement.decision?.code ?? 'a newer memory'}`, link: { target_type: 'memory', target_id: replacement.id } }];
        break;
      }
    }
    memory.updated_at = at;
    const verb = { confirm: 'Confirmed', reject: 'Rejected', edit: 'Edited', supersede: 'Marked superseded:' }[request.op];
    const label = memory.title ?? memory.content;
    recordAudit(db, {
      actor_type: 'user',
      category: 'memory',
      event_type: `memory.${request.op}`,
      target_type: 'memory',
      target_id: id,
      summary: `${verb} ${isDecision ? 'decision' : 'memory'} {link}`,
      link: { label: label.length > 48 ? `${label.slice(0, 45)}…` : label, target_type: 'memory', target_id: id },
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
    for (const claim of db.claims) claim.used_by_decisions = claim.used_by_decisions.filter((d) => d.id !== id);
    db.alerts = db.alerts.filter((a) => a.memory_id !== id);
    recordAudit(db, { actor_type: 'user', category: 'memory', event_type: 'memory.deleted', target_type: 'memory', target_id: id, summary: `Deleted memory “${(memory.title ?? memory.content).slice(0, 40)}”`, link: null, result: 'succeeded' });
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
