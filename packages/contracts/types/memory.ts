import type { Id, ISODateTime, Origin } from './common';

export type MemoryType = 'episodic' | 'semantic' | 'procedural' | 'project';

export type MemoryStatus = 'candidate' | 'confirmed' | 'superseded' | 'rejected';

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
}

export interface MemoryListQuery {
  status?: MemoryStatus | 'needs_review';
  memory_type?: MemoryType;
  project_id?: Id;
  q?: string;
  decisions_only?: boolean;
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
}

/** PATCH /api/v1/memories/{id} — one operation per request. */
export type UpdateMemoryRequest =
  | { op: 'confirm' }
  | { op: 'reject' }
  | { op: 'edit'; content: string; memory_type?: MemoryType }
  | { op: 'supersede'; superseded_by_id: Id };
