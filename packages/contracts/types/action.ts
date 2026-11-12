import type { Id, ISODateTime } from './common';

/** Action lifecycle (PRD §12). */
export type ProposalStatus =
  | 'draft'
  | 'validating'
  | 'awaiting_approval'
  | 'approved'
  | 'executing'
  | 'verifying'
  | 'succeeded'
  | 'failed'
  | 'rejected'
  | 'expired';

export type RiskLevel = 'read' | 'low_write' | 'external_communication' | 'destructive';

export interface CreateIssueArguments {
  repository: string;
  title: string;
  body: string;
  labels: string[];
  assignees: string[];
}

export interface ProposalCitation {
  ordinal: number;
  source_id: Id;
  source_title: string;
  page: number;
  section: string;
}

export interface SideEffect {
  kind: 'creates' | 'notifies' | 'unchanged';
  text: string;
}

export interface ValidationIssue {
  field: string;
  message: string;
}

export interface RunStep {
  label: string;
  state: 'done' | 'active' | 'pending' | 'failed';
  at: ISODateTime | null;
}

export interface VerificationCheck {
  label: string;
  passed: boolean;
  detail: string | null;
}

/** action_runs (PRD §10). */
export interface ActionRun {
  id: Id;
  proposal_id: Id;
  attempt: number;
  status: 'executing' | 'verifying' | 'succeeded' | 'failed';
  external_ref: string | null;
  external_url: string | null;
  error_message: string | null;
  started_at: ISODateTime;
  executed_at: ISODateTime | null;
  verified_at: ISODateTime | null;
  steps: RunStep[];
  verification: VerificationCheck[];
  audit_event_id: Id | null;
}

/** action_proposals (PRD §10) with the context the review screen shows. */
export interface ActionProposal {
  id: Id;
  task_id: Id;
  connection_id: Id;
  tool: 'github.create_issue';
  title: string;
  status: ProposalStatus;
  risk_level: RiskLevel;
  idempotency_key: string;
  revision: number;
  project_id: Id | null;
  project_name: string | null;
  conversation_id: Id | null;
  conversation_title: string | null;
  proposed_by: 'agent' | 'user';
  created_at: ISODateTime;
  expires_at: ISODateTime;
  decided_by: Id | null;
  decided_at: ISODateTime | null;
  reject_reason: string | null;
  target: { provider: 'github'; account: string; repository: string; visibility: 'public' | 'private' };
  action_label: string;
  required_permission: { label: string; granted_at: ISODateTime };
  original_request: { text: string; at: ISODateTime };
  arguments: CreateIssueArguments;
  citations: ProposalCitation[];
  side_effects: SideEffect[];
  validation: { status: 'passed' | 'failed' | 'pending'; issues: ValidationIssue[] };
  changes_since_proposal: string[];
  latest_run: ActionRun | null;
  audit_event_id: Id | null;
  /** v2: where the proposal came from (PRD §8.7). */
  origin?: ProposalOrigin;
  /** v2: decision the created issue is linked back to. */
  linked_decision?: { id: Id; code: string | null; title: string } | null;
}

export interface ProposalOrigin {
  type: 'assistant' | 'decision_alert' | 'manual';
  id: Id | null;
  label: string;
}

export interface ProposalListResponse {
  items: ActionProposal[];
  next_cursor: string | null;
  total: number;
  counts: { pending: number; decided: number };
}

/** PATCH /api/v1/action-proposals/{id} — edits return the proposal to Draft. */
export interface UpdateProposalRequest {
  arguments: CreateIssueArguments;
  /** Optimistic concurrency check. */
  revision: number;
}

export interface ApproveProposalResponse {
  proposal: ActionProposal;
  run: ActionRun;
}

export interface RejectProposalRequest {
  reason?: string;
}
