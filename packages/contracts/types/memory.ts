import type { Id, ISODateTime, Origin } from './common';
import type { ReviewState } from './claim';

export type MemoryType = 'episodic' | 'semantic' | 'procedural' | 'project';

/** v2 adds `proposed` for decisions; other memory types keep `candidate`. */
export type MemoryStatus = 'candidate' | 'proposed' | 'confirmed' | 'superseded' | 'rejected';

/** v2 (PRD §12 memories.kind). */
export type MemoryKind = 'decision' | 'fact' | 'event' | 'preference';

/** Where a memory came from, rendered as the "Source / evidence" link. */
export interface MemoryEvidenceRef {
  kind: 'conversation' | 'source' | 'user';
  label: string;
  conversation_id: Id | null;
  source_id: Id | null;
  page: number | null;
}

/** Decision record fields (UI.md §4.9). Present when the memory is a project decision. */
export interface DecisionRecord {
  code: string;
  title: string;
  rationale: string | null;
  evidence: Array<{ source_id: Id; label: string; page: number }>;
}

/** memories (PRD §10). */
export interface Memory {
  id: Id;
  workspace_id: Id;
  project_id: Id | null;
  project_name: string | null;
  memory_type: MemoryType;
  content: string;
  origin: Origin;
  status: MemoryStatus;
  confidence: number | null;
  supersedes_id: Id | null;
  superseded_by_id: Id | null;
  valid_from: ISODateTime | null;
  valid_to: ISODateTime | null;
  created_at: ISODateTime;
  updated_at: ISODateTime;
  evidence: MemoryEvidenceRef;
  decision: DecisionRecord | null;
  /* v2 fields (PRD §8.5, §12). Optional so v1 clients keep working. */
  kind?: MemoryKind;
  title?: string | null;
  rationale?: string | null;
  review_state?: ReviewState;
  dependencies?: DecisionDependency[];
  decided_at?: ISODateTime | null;
  history?: DecisionHistoryEntry[];
  /** Open Decision Impact alert, if any. */
  open_alert_id?: Id | null;
}

/** decision_dependencies (PRD §12) with the claim's current counts. */
export interface DecisionDependency {
  claim_id: Id;
  statement: string;
  supports_count: number;
  contradicts_count: number;
  note: string | null;
}

export interface DecisionHistoryEntry {
  at: ISODateTime;
  kind: 'created' | 'confirmed' | 'edited' | 'superseded' | 'alert_raised' | 'alert_kept' | 'alert_resolved' | 'action_proposed' | 'dependencies_changed';
  text: string;
  link: { target_type: 'memory' | 'decision_alert' | 'proposal' | 'source'; target_id: Id } | null;
}

export interface MemoryListQuery {
  status?: MemoryStatus | 'needs_review';
  memory_type?: MemoryType;
  project_id?: Id;
  q?: string;
  decisions_only?: boolean;
  /** v2: filter by review state (`status=needs_review` keeps its v1 meaning). */
  review_state?: ReviewState;
  kind?: MemoryKind;
}

export interface MemoryListResponse {
  items: Memory[];
  next_cursor: string | null;
  total: number;
  counts: Record<MemoryStatus, number>;
}

export interface CreateMemoryRequest {
  memory_type: MemoryType;
  content: string;
  project_id: Id | null;
  /* v2 decision fields (Save as decision, Revise decision). */
  kind?: MemoryKind;
  title?: string;
  rationale?: string;
  status?: 'proposed' | 'confirmed';
  dependencies?: Id[];
  evidence?: Array<{ source_id: Id; label: string; page: number }>;
  from_message_id?: Id;
  /** Saving a revision supersedes this decision. */
  supersedes_id?: Id;
}

/** PUT /api/v1/memories/{id}/dependencies */
export interface SetDependenciesRequest {
  claim_ids: Id[];
}

/** PATCH /api/v1/memories/{id} — one operation per request. */
export type UpdateMemoryRequest =
  | { op: 'confirm' }
  | { op: 'reject' }
  | { op: 'edit'; content: string; memory_type?: MemoryType }
  | { op: 'supersede'; superseded_by_id: Id };
