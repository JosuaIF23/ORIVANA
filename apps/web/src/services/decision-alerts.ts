import type {
  ActionProposal,
  AlertStatus,
  DecisionAlert,
  DecisionAlertListQuery,
  DecisionAlertListResponse,
  DecisionHistoryEntry,
  ProposeFromAlertRequest,
  ProposeFromAlertResponse,
  UpdateDecisionAlertRequest,
} from '@contracts/types';
import { nowIso } from '@/lib/clock';
import { fixtures } from './core/fixtures';
import { fail, failWith, simulate } from './core/http';
import { recordAudit, requireDb } from './core/session';
import type { MockDb } from './core/store';

function live(db: MockDb, alert: DecisionAlert): DecisionAlert {
  const deleted = !db.sources.some((s) => s.id === alert.trigger_source_id);
  return deleted === alert.trigger_source_deleted ? alert : { ...alert, trigger_source_deleted: deleted };
}

/** Recomputes review state and the Home badge after an alert changes. */
export function syncDecisionReview(db: MockDb) {
  for (const d of db.decisions) {
    const alert = db.alerts.find((a) => a.memory_id === d.id && a.status === 'open');
    if (d.review_state === undefined && !alert) continue;
    d.open_alert_id = alert?.id ?? null;
    // Decisions that lost all evidence stay in review (PRD §12.4) even without an alert.
    const evidenceDeleted = d.history?.some((h) => h.text.includes('evidence deleted')) ?? false;
    d.review_state = alert || evidenceDeleted ? 'needs_review' : 'ok';
  }
  db.me.counts.decisions_needing_review = db.decisions.filter((d) => d.review_state === 'needs_review' && d.status !== 'superseded').length;
  for (const p of db.projects) {
    p.counts.decisions_needing_review = db.decisions.filter((d) => d.project_id === p.id && d.review_state === 'needs_review' && d.status !== 'superseded').length;
  }
}

/** GET /api/v1/decision-alerts?status=open */
export function listDecisionAlerts(query: DecisionAlertListQuery = {}): Promise<DecisionAlertListResponse> {
  return simulate(() => {
    const db = requireDb();
    const scoped = db.alerts
      .filter((a) => !query.project_id || a.project_id === query.project_id)
      .filter((a) => !query.memory_id || a.memory_id === query.memory_id);
    const counts: Record<AlertStatus, number> = { open: 0, dismissed: 0, resolved: 0 };
    for (const a of scoped) counts[a.status] += 1;
    const items = scoped.filter((a) => !query.status || a.status === query.status).map((a) => live(db, a)).toSorted((a, b) => b.detected_at.localeCompare(a.detected_at));
    return { items, next_cursor: null, total: items.length, counts };
  }, { ms: 300 });
}

function find(db: MockDb, id: string): DecisionAlert {
  const alert = db.alerts.find((a) => a.id === id);
  if (!alert) failWith('NOT_FOUND', 'This alert no longer exists.');
  return alert;
}

/** GET /api/v1/decision-alerts/{id} */
export function getDecisionAlert(id: string): Promise<DecisionAlert> {
  return simulate(() => {
    const db = requireDb();
    return live(db, find(db, id));
  }, { ms: 320 });
}

type HistoryInput = Omit<DecisionHistoryEntry, 'at'>;

function addHistory(db: MockDb, memoryId: string, entry: HistoryInput) {
  const decision = db.decisions.find((d) => d.id === memoryId);
  if (!decision) return;
  decision.history = [...(decision.history ?? []), { at: nowIso(), ...entry }];
  decision.updated_at = nowIso();
}

/** PATCH /api/v1/decision-alerts/{id} — Keep (dismiss with a note) or resolve after a revision. */
export function updateDecisionAlert(id: string, request: UpdateDecisionAlertRequest): Promise<DecisionAlert> {
  return simulate(() => {
    const db = requireDb();
    const alert = find(db, id);
    if (alert.status !== 'open') failWith('CONFLICT', 'This alert was already resolved.', { status: alert.status });
    const at = nowIso();
    if (request.status === 'dismissed') {
      if (!request.resolution_note.trim()) fail(fixtures.alerts.noteRequired);
      alert.status = 'dismissed';
      alert.resolution = { kind: 'kept', note: request.resolution_note.trim(), by: db.me.user.id, at, replacement_memory_id: null, proposal_id: alert.proposal_id };
      addHistory(db, alert.memory_id, { kind: 'alert_kept', text: `Kept after review: ${request.resolution_note.trim()}`, link: { target_type: 'decision_alert', target_id: id } });
    } else {
      const replacement = db.decisions.find((d) => d.id === request.replacement_memory_id);
      if (!replacement) failWith('VALIDATION_FAILED', 'Save the revised decision first.', { field: 'replacement_memory_id' });
      alert.status = 'resolved';
      alert.resolution = { kind: 'revised', note: request.resolution_note?.trim() || null, by: db.me.user.id, at, replacement_memory_id: replacement.id, proposal_id: alert.proposal_id };
      addHistory(db, alert.memory_id, { kind: 'alert_resolved', text: `Revised as ${replacement.decision?.code ?? 'a new decision'}`, link: { target_type: 'memory', target_id: replacement.id } });
    }
    alert.updated_at = at;
    syncDecisionReview(db);
    recordAudit(db, {
      actor_type: 'user',
      category: 'decision_alerts',
      event_type: `decision_alert.${alert.status}`,
      target_type: 'decision_alert',
      target_id: id,
      summary: alert.status === 'dismissed' ? 'Kept decision {link} after review' : 'Revised decision {link} after review',
      link: { label: `${alert.decision_code ?? ''} ${alert.decision_title}`.trim(), target_type: 'decision_alert', target_id: id },
      result: 'confirmed',
    });
    return alert;
  }, { ms: 520 });
}

/**
 * POST /api/v1/decision-alerts/{id}/propose-action. Creates an issue proposal;
 * nothing runs until it is approved in Approvals. The alert stays open.
 */
export function proposeActionFromAlert(id: string, request: ProposeFromAlertRequest = { tool: 'github.create_issue' }): Promise<ProposeFromAlertResponse> {
  return simulate(() => {
    const db = requireDb();
    const alert = find(db, id);
    if (alert.status !== 'open') failWith('CONFLICT', 'This alert was already resolved.', { status: alert.status });
    if (alert.proposal_id) return { alert, proposal_id: alert.proposal_id };
    const github = db.connections.find((c) => c.provider === 'github' && c.status !== 'revoked');
    if (!github) failWith('CONNECTION_NEEDS_RECONNECT', 'Connect GitHub in Integrations to propose an issue.');
    const at = nowIso();
    const template = structuredClone(fixtures.alerts.proposal);
    const proposal: ActionProposal = {
      ...template,
      id: template.id,
      created_at: at,
      expires_at: new Date(Date.parse(at) + 7 * 86_400_000).toISOString().replace('.000Z', 'Z'),
      original_request: { ...template.original_request, at },
      arguments: { ...template.arguments, repository: request.repository ?? template.arguments.repository },
    };
    db.proposals.unshift(proposal);
    alert.proposal_id = proposal.id;
    alert.updated_at = at;
    db.me.counts.pending_approvals = db.proposals.filter((p) => ['awaiting_approval', 'draft', 'validating'].includes(p.status)).length;
    const project = db.projects.find((p) => p.id === proposal.project_id);
    if (project) project.counts.pending_actions += 1;
    addHistory(db, alert.memory_id, { kind: 'action_proposed', text: `Proposed GitHub issue “${proposal.arguments.title}”`, link: { target_type: 'proposal', target_id: proposal.id } });
    recordAudit(db, {
      actor_type: 'agent',
      category: 'proposals',
      event_type: 'action_proposal.created',
      target_type: 'proposal',
      target_id: proposal.id,
      summary: 'Proposed an issue in {link} from a Decision Impact alert',
      link: { label: proposal.arguments.repository, target_type: 'repository', target_id: proposal.arguments.repository },
      result: 'awaiting_approval',
      metadata: { related: { label: proposal.title, target_type: 'proposal', target_id: proposal.id, project_name: proposal.project_name ?? undefined } },
    });
    return { alert, proposal_id: proposal.id };
  }, { ms: 900 });
}
