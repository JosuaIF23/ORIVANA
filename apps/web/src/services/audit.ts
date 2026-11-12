import type { AuditCategory, AuditEvent, AuditListQuery, AuditListResponse } from '@contracts/types';
import { now } from '@/lib/clock';
import { simulate } from './core/http';
import { requireDb } from './core/session';

export const AUDIT_PAGE_SIZE = 10;

function matches(e: AuditEvent, q: string) {
  return [e.summary, e.link?.label ?? '', e.id, e.request_id, e.target_id].some((v) => v.toLowerCase().includes(q));
}

/** GET /api/v1/audit-events */
export function listAuditEvents(query: AuditListQuery & { limit?: number } = {}): Promise<AuditListResponse> {
  return simulate(() => {
    const db = requireDb();
    const since = query.since_days ? now().getTime() - query.since_days * 86_400_000 : 0;
    const q = query.q?.trim().toLowerCase();
    const scoped = db.audit
      .filter((e) => Date.parse(e.created_at) >= since)
      .filter((e) => !query.actor_type || e.actor_type === query.actor_type)
      .filter((e) => !q || matches(e, q));
    const counts: Record<AuditCategory, number> = { ingestion: 0, zotero_sync: 0, retrieval: 0, extraction: 0, memory: 0, decision_alerts: 0, proposals: 0, tool_calls: 0, approvals: 0, external_actions: 0, errors: 0 };
    for (const e of scoped) counts[e.category] += 1;
    const filtered = scoped
      .filter((e) => !query.categories?.length || query.categories.includes(e.category))
      .toSorted((a, b) => b.created_at.localeCompare(a.created_at));
    const limit = query.limit ?? AUDIT_PAGE_SIZE;
    const offset = query.cursor ? Number(query.cursor) : 0;
    return {
      items: filtered.slice(0, offset + limit),
      next_cursor: offset + limit < filtered.length ? String(offset + limit) : null,
      total: filtered.length,
      counts,
    };
  }, { ms: 340 });
}

/** GET /api/v1/audit-events/export (extension) — returns CSV text. */
export function exportAuditCsv(query: AuditListQuery = {}): Promise<string> {
  return listAuditEvents({ ...query, limit: 10_000 }).then((res) => {
    const header = 'id,created_at,actor_type,category,event_type,target_type,target_id,result,request_id';
    const rows = res.items.map((e) => [e.id, e.created_at, e.actor_type, e.category, e.event_type, e.target_type, e.target_id, e.result, e.request_id].map((v) => `"${String(v).replaceAll('"', '""')}"`).join(','));
    return [header, ...rows].join('\n');
  });
}
