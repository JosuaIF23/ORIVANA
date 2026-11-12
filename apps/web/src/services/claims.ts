import type { Claim, ClaimDetail, ClaimListQuery, ClaimListResponse, UpdateClaimRequest } from '@contracts/types';
import { nowIso } from '@/lib/clock';
import { fixtures } from './core/fixtures';
import { fail, failWith, simulate } from './core/http';
import { recordAudit, requireDb } from './core/session';
import type { MockDb } from './core/store';

/**
 * Applies the current relationship status from the Map store (a relationship
 * confirmed or rejected there changes the claim too), drops rejected evidence,
 * and recounts supports / contradicts / mentions per paper.
 */
function live(db: MockDb, claim: ClaimDetail): ClaimDetail {
  const evidence = claim.evidence
    .map((e) => ({ ...e, status: db.relationships.find((r) => r.id === e.relationship_id)?.status ?? e.status }))
    .filter((e) => e.status !== 'rejected');
  const count = (stance: string) => new Set(evidence.filter((e) => e.stance === stance).map((e) => e.source_id)).size;
  const used_by_decisions = claim.used_by_decisions.map((d) => {
    const decision = db.decisions.find((m) => m.id === d.id);
    return decision ? { ...d, title: decision.title ?? d.title, review_state: decision.review_state ?? d.review_state } : d;
  });
  return { ...claim, evidence, used_by_decisions, supports_count: count('supports'), contradicts_count: count('contradicts'), mentions_count: count('mentions') };
}

function summary(detail: ClaimDetail): Claim {
  const { evidence: _e, context_note: _c, merge_suggestions: _m, ...rest } = detail;
  return rest;
}

const SORTERS: Record<NonNullable<ClaimListQuery['sort']>, (a: Claim, b: Claim) => number> = {
  most_contested: (a, b) => b.contradicts_count - a.contradicts_count || b.used_by_decisions.length - a.used_by_decisions.length || b.supports_count - a.supports_count,
  most_supported: (a, b) => b.supports_count - a.supports_count || a.contradicts_count - b.contradicts_count,
  used_by_decisions: (a, b) => b.used_by_decisions.length - a.used_by_decisions.length || b.contradicts_count - a.contradicts_count,
  newest: (a, b) => b.updated_at.localeCompare(a.updated_at),
};

/** GET /api/v1/claims?project_id=&sort=&status=&has_contradictions= */
export function listClaims(query: ClaimListQuery = {}): Promise<ClaimListResponse> {
  return simulate(() => {
    const db = requireDb();
    const q = query.q?.trim().toLowerCase();
    const items = db.claims
      .filter((c) => c.status !== 'rejected' || query.status === 'rejected')
      .map((c) => summary(live(db, c)))
      .filter((c) => !query.project_id || c.project_id === query.project_id)
      .filter((c) => !query.status || c.status === query.status)
      .filter((c) => !query.has_contradictions || c.contradicts_count > 0)
      .filter((c) => !q || c.statement.toLowerCase().includes(q) || c.short_name.toLowerCase().includes(q))
      .toSorted(SORTERS[query.sort ?? 'most_contested']);
    return { items, next_cursor: null, total: items.length };
  }, { ms: 360 });
}

function find(db: MockDb, id: string): ClaimDetail {
  const claim = db.claims.find((c) => c.id === id);
  if (!claim) failWith('NOT_FOUND', 'Claim not found.');
  return claim;
}

/** GET /api/v1/claims/{id} */
export function getClaim(id: string): Promise<ClaimDetail> {
  return simulate(() => {
    const db = requireDb();
    return live(db, find(db, id));
  }, { ms: 320 });
}

/** PATCH /api/v1/claims/{id} — confirm, reject, or merge into another claim. */
export function updateClaim(id: string, request: UpdateClaimRequest): Promise<ClaimDetail> {
  return simulate(() => {
    const db = requireDb();
    const claim = find(db, id);
    if (claim.status !== 'candidate' && request.op !== 'merge') fail(fixtures.claims.conflict, { details: { status: claim.status } });
    let summaryText: string;
    if (request.op === 'merge') {
      const target = find(db, request.into_claim_id);
      if (target.id === claim.id) failWith('VALIDATION_FAILED', 'Choose a different claim to merge into.', { field: 'into_claim_id' });
      const known = new Set(target.evidence.map((e) => e.relationship_id));
      target.evidence.push(...claim.evidence.filter((e) => !known.has(e.relationship_id)));
      target.merge_suggestions = target.merge_suggestions.filter((m) => m.id !== claim.id);
      target.updated_at = nowIso();
      claim.status = 'rejected';
      summaryText = `Merged claim “${claim.short_name}” into {link}`;
      recordAudit(db, { actor_type: 'user', category: 'extraction', event_type: 'claim.merged', target_type: 'claim', target_id: target.id, summary: summaryText, link: { label: target.statement, target_type: 'claim', target_id: target.id }, result: 'confirmed' });
      claim.updated_at = nowIso();
      return live(db, target);
    }
    claim.status = request.op === 'confirm' ? 'confirmed' : 'rejected';
    claim.updated_at = nowIso();
    summaryText = `${request.op === 'confirm' ? 'Confirmed' : 'Rejected'} claim {link}`;
    recordAudit(db, { actor_type: 'user', category: 'extraction', event_type: `claim.${request.op}`, target_type: 'claim', target_id: id, summary: summaryText, link: { label: claim.statement, target_type: 'claim', target_id: id }, result: claim.status === 'confirmed' ? 'confirmed' : 'rejected' });
    return live(db, claim);
  }, { ms: 420 });
}
