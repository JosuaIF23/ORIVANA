import type { ActionProposal, ActionRun, ApproveProposalResponse, CreateIssueArguments, ProposalListResponse, ValidationIssue } from '@contracts/types';
import { nowIso } from '@/lib/clock';
import { fixtures } from './core/fixtures';
import { delay, fail, failWith, simulate } from './core/http';
import { recordAudit, requireDb } from './core/session';
import type { MockDb } from './core/store';

const PENDING = new Set(['draft', 'validating', 'awaiting_approval', 'approved', 'executing', 'verifying']);

export type ProposalTab = 'pending' | 'decided';

/** GET /api/v1/action-proposals?status=pending|decided */
export function listProposals(tab: ProposalTab): Promise<ProposalListResponse> {
  return simulate(() => {
    const db = requireDb();
    const pending = db.proposals.filter((p) => PENDING.has(p.status));
    const decided = db.proposals.filter((p) => !PENDING.has(p.status));
    const items = tab === 'pending'
      ? pending.toSorted((a, b) => b.created_at.localeCompare(a.created_at))
      : decided.toSorted((a, b) => (b.decided_at ?? b.created_at).localeCompare(a.decided_at ?? a.created_at));
    return { items, next_cursor: null, total: items.length, counts: { pending: pending.length, decided: decided.length } };
  }, { ms: 300 });
}

function find(db: MockDb, id: string): ActionProposal {
  const proposal = db.proposals.find((p) => p.id === id);
  if (!proposal) failWith('NOT_FOUND', 'Proposal not found.');
  return proposal;
}

/** GET /api/v1/action-proposals/{id} */
export function getProposal(id: string): Promise<ActionProposal> {
  return simulate(() => find(requireDb(), id), { ms: 260 });
}

const originals = new Map<string, CreateIssueArguments>();

function validate(db: MockDb, args: CreateIssueArguments): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  const repo = db.connections.flatMap((c) => c.repositories).find((r) => r.full_name === args.repository);
  if (!repo) issues.push({ field: 'repository', message: 'Choose a repository you granted in Integrations.' });
  if (!args.title.trim()) issues.push({ field: 'title', message: 'Add a title.' });
  if (args.body.length > 65_536) issues.push({ field: 'body', message: 'The body is longer than GitHub allows (65,536 characters).' });
  for (const label of args.labels) {
    if (repo && !repo.labels.includes(label)) {
      issues.push({ field: 'labels', message: `“${label}” doesn’t exist in ${repo.full_name}. ORIVANA won’t create labels, so validation will ask you to remove it.` });
    }
  }
  return issues;
}

function describeChanges(before: CreateIssueArguments, after: CreateIssueArguments): string[] {
  const changes: string[] = [];
  if (before.repository !== after.repository) changes.push('repository');
  if (before.title !== after.title) changes.push('title');
  if (before.body !== after.body) changes.push(before.body.split('## Task')[1] !== after.body.split('## Task')[1] ? 'task list' : 'body');
  const added = after.labels.filter((l) => !before.labels.includes(l)).length;
  const removed = before.labels.filter((l) => !after.labels.includes(l)).length;
  if (added) changes.push(`${added} label${added > 1 ? 's' : ''} added`);
  if (removed) changes.push(`${removed} label${removed > 1 ? 's' : ''} removed`);
  return changes;
}

/** Client-side preview of server validation (labels, title) used while editing. */
export function previewValidation(args: CreateIssueArguments): ValidationIssue[] {
  return validate(requireDb(), args);
}

/** PATCH /api/v1/action-proposals/{id} — edits return the proposal to Draft and re-validate. */
export function updateProposal(id: string, args: CreateIssueArguments, revision: number): Promise<ActionProposal> {
  return simulate(() => {
    const db = requireDb();
    const proposal = find(db, id);
    if (proposal.revision !== revision) fail(fixtures.proposals.revisionConflict);
    if (!['awaiting_approval', 'draft'].includes(proposal.status)) failWith('CONFLICT', 'This proposal was already decided.');
    if (!originals.has(id)) originals.set(id, structuredClone(proposal.arguments));
    const issues = validate(db, args);
    proposal.arguments = structuredClone(args);
    proposal.revision += 1;
    proposal.changes_since_proposal = describeChanges(originals.get(id)!, args);
    proposal.validation = { status: issues.length ? 'failed' : 'passed', issues };
    proposal.status = issues.length ? 'draft' : 'awaiting_approval';
    return proposal;
  }, { ms: 900 });
}

/** Marks a proposal as being edited (Draft) without saving changes. */
export function startEditing(id: string): Promise<ActionProposal> {
  return simulate(() => {
    const proposal = find(requireDb(), id);
    if (proposal.status === 'awaiting_approval') {
      proposal.status = 'draft';
      proposal.validation = { status: 'pending', issues: [] };
    }
    return proposal;
  }, { ms: 200 });
}

/** Discarding an edit restores the last validated arguments. */
export function discardEditing(id: string): Promise<ActionProposal> {
  return simulate(() => {
    const db = requireDb();
    const proposal = find(db, id);
    if (proposal.status === 'draft') {
      const issues = validate(db, proposal.arguments);
      proposal.validation = { status: issues.length ? 'failed' : 'passed', issues };
      proposal.status = issues.length ? 'draft' : 'awaiting_approval';
    }
    return proposal;
  }, { ms: 200 });
}

let issueNumber = 41;

async function execute(db: MockDb, proposal: ActionProposal, run: ActionRun) {
  await delay(2200);
  run.status = 'verifying';
  run.executed_at = nowIso();
  run.steps[2] = { ...run.steps[2], state: 'done' };
  run.steps[3] = { ...run.steps[3], state: 'active', at: nowIso() };
  proposal.status = 'verifying';
  await delay(1600);
  issueNumber += 1;
  const ref = `${proposal.arguments.repository}#${issueNumber}`;
  const audit = recordAudit(db, {
    actor_type: 'system',
    category: 'external_actions',
    event_type: 'external_action.succeeded',
    target_type: 'issue',
    target_id: ref,
    summary: 'Created and verified issue {link}',
    link: { label: ref, target_type: 'issue', target_id: ref },
    result: 'verified',
  });
  Object.assign(run, {
    status: 'succeeded',
    verified_at: nowIso(),
    external_ref: ref,
    external_url: `https://github.com/${proposal.arguments.repository}/issues/${issueNumber}`,
    audit_event_id: audit.id,
    verification: [
      { label: 'Issue exists', passed: true, detail: ref },
      { label: 'Title and body match the approved content', passed: true, detail: null },
      { label: `Labels match: ${proposal.arguments.labels.join(', ') || 'none'}`, passed: true, detail: null },
      { label: 'No duplicate found for idempotency key', passed: true, detail: proposal.idempotency_key },
    ],
  } satisfies Partial<ActionRun>);
  run.steps = run.steps.map((s) => ({ ...s, state: 'done', at: s.at ?? nowIso() }));
  proposal.status = 'succeeded';
  proposal.audit_event_id = audit.id;
}

/** POST /api/v1/action-proposals/{id}/approve — the only call that writes to GitHub. */
export function approveProposal(id: string): Promise<ApproveProposalResponse> {
  return simulate(() => {
    const db = requireDb();
    const proposal = find(db, id);
    if (proposal.status !== 'awaiting_approval' || proposal.validation.status !== 'passed') fail(fixtures.proposals.notValidated);
    if (db.connections.some((c) => c.status !== 'connected')) failWith('CONNECTION_NEEDS_RECONNECT', 'Reconnect GitHub before approving. Pending proposals can’t run until you do.');
    const template = structuredClone(fixtures.proposals.approve.run);
    const at = nowIso();
    const run: ActionRun = {
      ...template,
      id: `run_${id.slice(5, 13)}`,
      proposal_id: id,
      started_at: at,
      steps: template.steps.map((s, i) => ({ ...s, at: i === 0 ? proposal.created_at : i <= 2 ? at : null })),
    };
    proposal.status = 'executing';
    proposal.decided_by = db.me.user.id;
    proposal.decided_at = at;
    proposal.latest_run = run;
    recordAudit(db, {
      actor_type: 'user',
      category: 'approvals',
      event_type: 'action_proposal.approved',
      target_type: 'proposal',
      target_id: id,
      summary: `Approved proposal “${proposal.arguments.title}” for {link}`,
      link: { label: proposal.arguments.repository, target_type: 'repository', target_id: proposal.arguments.repository },
      result: 'succeeded',
    });
    void execute(db, proposal, run);
    return { proposal, run };
  }, { ms: 500 });
}

/** POST /api/v1/action-proposals/{id}/reject */
export function rejectProposal(id: string, reason?: string): Promise<ActionProposal> {
  return simulate(() => {
    const db = requireDb();
    const proposal = find(db, id);
    if (!['awaiting_approval', 'draft'].includes(proposal.status)) failWith('CONFLICT', 'This proposal was already decided.');
    const audit = recordAudit(db, {
      actor_type: 'user',
      category: 'approvals',
      event_type: 'action_proposal.rejected',
      target_type: 'proposal',
      target_id: id,
      summary: `Rejected proposal “${proposal.arguments.title}” for {link}`,
      link: { label: proposal.arguments.repository, target_type: 'repository', target_id: proposal.arguments.repository },
      result: 'rejected',
    });
    Object.assign(proposal, { status: 'rejected', decided_by: db.me.user.id, decided_at: nowIso(), reject_reason: reason?.trim() || null, audit_event_id: audit.id });
    return proposal;
  }, { ms: 450 });
}

/** Used by the stream simulator when the assistant drafts an issue (Flow D). */
export function ensureProposalFromChat(db: MockDb, conversationId: string, question: string): string {
  const open = db.proposals.find((p) => p.conversation_id === conversationId && PENDING.has(p.status));
  if (open) return open.id;
  const template = structuredClone(fixtures.proposals.pending.items[0]);
  const conversation = db.conversations.find((c) => c.id === conversationId);
  const id = `prop_live${db.proposals.length + 1}`;
  const created: ActionProposal = {
    ...template,
    id,
    idempotency_key: id,
    conversation_id: conversationId,
    conversation_title: conversation?.title ?? null,
    project_id: conversation?.project_id ?? template.project_id,
    project_name: conversation?.project_name ?? template.project_name,
    created_at: nowIso(),
    expires_at: new Date(Date.now() + 7 * 86_400_000).toISOString(),
    original_request: { text: question, at: nowIso() },
  };
  db.proposals.unshift(created);
  recordAudit(db, {
    actor_type: 'agent',
    category: 'approvals',
    event_type: 'action_proposal.created',
    target_type: 'proposal',
    target_id: id,
    summary: 'Proposed creating an issue in {link}',
    link: { label: created.target.repository, target_type: 'repository', target_id: created.target.repository },
    result: 'awaiting_approval',
  });
  return id;
}
