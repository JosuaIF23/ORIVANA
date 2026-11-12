import type { ActorType, Id, ISODateTime } from './common';

export type AuditCategory =
  | 'ingestion'
  | 'retrieval'
  | 'memory'
  | 'tool_calls'
  | 'approvals'
  | 'external_actions'
  | 'errors';

export type AuditResult =
  | 'succeeded'
  | 'failed'
  | 'in_progress'
  | 'awaiting_approval'
  | 'candidate'
  | 'confirmed'
  | 'rejected'
  | 'verified'
  | 'ready';

/** A link rendered inside the event summary. */
export interface AuditLink {
  label: string;
  target_type: 'source' | 'conversation' | 'proposal' | 'memory' | 'repository' | 'issue' | 'project';
  target_id: string;
}

/** audit_events (PRD §10) with display fields. */
export interface AuditEvent {
  id: Id;
  workspace_id: Id;
  actor_type: ActorType;
  actor_id: Id;
  event_type: string;
  category: AuditCategory;
  target_type: string;
  target_id: Id;
  /** Summary text; `{link}` is replaced by `link.label`. */
  summary: string;
  link: AuditLink | null;
  result: AuditResult;
  request_id: string;
  created_at: ISODateTime;
  metadata: {
    error_code?: string;
    error_message?: string;
    job?: string;
    related?: AuditLink & { project_name?: string };
  };
}

export interface AuditListQuery {
  categories?: AuditCategory[];
  actor_type?: ActorType;
  since_days?: 1 | 7 | 30;
  q?: string;
  cursor?: string;
}

export interface AuditListResponse {
  items: AuditEvent[];
  next_cursor: string | null;
  total: number;
  counts: Record<AuditCategory, number>;
}
