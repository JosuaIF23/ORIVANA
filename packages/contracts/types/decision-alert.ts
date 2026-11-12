import type { Id, ISODateTime } from './common';
import type { EvidenceLink } from './graph';

export type AlertSeverity = 'weakens' | 'uncertain';
export type AlertStatus = 'open' | 'dismissed' | 'resolved';

/** Evidence shown on either side of the Decision Impact comparison. */
export interface AlertEvidence {
  source_id: Id;
  source_label: string;
  source_title: string;
  /** Set for sources imported from Zotero. */
  imported_at: ISODateTime | null;
  passage: EvidenceLink;
}

/** decision_alerts (PRD §12) with the context the review page renders. */
export interface DecisionAlert {
  id: Id;
  workspace_id: Id;
  project_id: Id | null;
  project_name: string | null;
  memory_id: Id;
  decision_code: string | null;
  decision_title: string;
  decision_statement: string;
  decision_rationale: string | null;
  decided_at: ISODateTime | null;
  claim_id: Id;
  claim_statement: string;
  /** Support before the trigger, e.g. "Supported by 2 papers". */
  previous_support: { supports_count: number; contradicts_count: number };
  trigger_source_id: Id;
  trigger_source_label: string;
  trigger_relationship_id: Id;
  severity: AlertSeverity;
  /** System assessment, labelled as model-generated in the UI. */
  reason: string;
  confidence: number;
  status: AlertStatus;
  resolution: null | {
    kind: 'kept' | 'revised' | 'action_proposed';
    note: string | null;
    by: Id;
    at: ISODateTime;
    replacement_memory_id: Id | null;
    proposal_id: Id | null;
  };
  previous_evidence: AlertEvidence[];
  new_evidence: AlertEvidence[];
  /** Proposal created from this alert, if any. */
  proposal_id: Id | null;
  /** True when the triggering source was deleted after the alert. */
  trigger_source_deleted: boolean;
  detected_at: ISODateTime;
  updated_at: ISODateTime;
}

/** GET /api/v1/decision-alerts?status=open&project_id= */
export interface DecisionAlertListQuery {
  status?: AlertStatus;
  project_id?: Id;
  memory_id?: Id;
}

export interface DecisionAlertListResponse {
  items: DecisionAlert[];
  next_cursor: string | null;
  total: number;
  counts: Record<AlertStatus, number>;
}

/** PATCH /api/v1/decision-alerts/{id} — keep (dismiss with a note) or resolve after revising. */
export type UpdateDecisionAlertRequest =
  | { status: 'dismissed'; resolution_note: string }
  | { status: 'resolved'; resolution_note?: string; replacement_memory_id: Id };

/** POST /api/v1/decision-alerts/{id}/propose-action */
export interface ProposeFromAlertRequest {
  tool: 'github.create_issue';
  repository?: string;
}

export interface ProposeFromAlertResponse {
  alert: DecisionAlert;
  proposal_id: Id;
}
