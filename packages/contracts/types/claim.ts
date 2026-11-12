import type { Id, ISODateTime } from './common';
import type { EvidenceLink, RelationshipStatus } from './graph';

export type ClaimStatus = 'candidate' | 'confirmed' | 'rejected';
export type ClaimStance = 'supports' | 'contradicts' | 'mentions';
export type ReviewState = 'ok' | 'needs_review';

/** A decision that depends on a claim (decision_dependencies, PRD §12). */
export interface ClaimDecisionRef {
  id: Id;
  code: string | null;
  title: string;
  review_state: ReviewState;
}

/** claims (PRD §12) joined with the Claim entity. `id` is the Claim entity id. */
export interface Claim {
  id: Id;
  project_id: Id | null;
  project_name: string | null;
  /** Full declarative statement. */
  statement: string;
  /** Short entity name used in the Map. */
  short_name: string;
  status: ClaimStatus;
  supports_count: number;
  contradicts_count: number;
  mentions_count: number;
  used_by_decisions: ClaimDecisionRef[];
  /** True when a contradicting relationship was added after the newest dependent decision. */
  has_new_contradiction: boolean;
  created_at: ISODateTime;
  updated_at: ISODateTime;
}

export type ClaimSort = 'most_contested' | 'most_supported' | 'used_by_decisions' | 'newest';

/** GET /api/v1/claims?project_id=&sort=&status=&has_contradictions= */
export interface ClaimListQuery {
  project_id?: Id;
  sort?: ClaimSort;
  status?: ClaimStatus;
  has_contradictions?: boolean;
  q?: string;
}

export interface ClaimListResponse {
  items: Claim[];
  next_cursor: string | null;
  total: number;
}

/** One paper's stance on a claim, with its passages. */
export interface ClaimEvidence {
  relationship_id: Id;
  stance: ClaimStance;
  status: RelationshipStatus;
  confidence: number | null;
  source_id: Id;
  source_label: string;
  source_title: string;
  /** Present for Zotero imports; shown as "Imported …". */
  imported_at: ISODateTime | null;
  evidence: EvidenceLink[];
}

/** GET /api/v1/claims/{id} */
export interface ClaimDetail extends Claim {
  evidence: ClaimEvidence[];
  /** Model-generated note when evidence differs in context. Always labelled as such. */
  context_note: { text: string; generated_by: 'model' } | null;
  merge_suggestions: Array<{ id: Id; statement: string }>;
}

/** PATCH /api/v1/claims/{id} — one operation per request. */
export type UpdateClaimRequest =
  | { op: 'confirm' }
  | { op: 'reject' }
  | { op: 'merge'; into_claim_id: Id };
