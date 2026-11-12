import type { Id, ISODateTime, Origin } from './common';

/** MVP graph node types (PRD §10). */
export type EntityType = 'paper' | 'method' | 'dataset' | 'claim' | 'concept' | 'project' | 'decision';

/** MVP edge types (UI.md §4.6, PRD §10). */
export type RelationType =
  | 'uses_method'
  | 'evaluates_on'
  | 'supports'
  | 'contradicts'
  /** v2: Paper → Concept / Claim (PRD §12.2). */
  | 'mentions'
  | 'supersedes'
  | 'derived_from'
  | 'contains';

export type RelationshipStatus = 'candidate' | 'confirmed' | 'rejected';

/** entities (PRD §10). */
export interface Entity {
  id: Id;
  workspace_id: Id;
  project_id: Id | null;
  canonical_name: string;
  entity_type: EntityType;
  status: 'active' | 'superseded';
  aliases: string[];
  source_id: Id | null;
  created_at: ISODateTime;
}

/** evidence_links (PRD §10), denormalised with the passage location for display. */
export interface EvidenceLink {
  id: Id;
  relationship_id: Id | null;
  memory_id: Id | null;
  chunk_id: Id;
  source_id: Id;
  source_label: string;
  page: number;
  section: string;
  /** Full passage text; `char_start`/`char_end` mark the quoted span inside it. */
  passage: string;
  quote: string;
  char_start: number;
  char_end: number;
}

/** relationships (PRD §10). */
export interface Relationship {
  id: Id;
  workspace_id: Id;
  from_entity_id: Id;
  to_entity_id: Id;
  relation_type: RelationType;
  confidence: number | null;
  status: RelationshipStatus;
  origin: Origin;
  extraction_method: 'model_section' | 'user';
  extracted_at: ISODateTime;
  valid_from: ISODateTime | null;
  valid_to: ISODateTime | null;
  evidence_count: number;
  source_count: number;
}

/** GET /api/v1/relationships/{id} */
export interface RelationshipDetail extends Relationship {
  from: Pick<Entity, 'id' | 'canonical_name' | 'entity_type'>;
  to: Pick<Entity, 'id' | 'canonical_name' | 'entity_type'>;
  evidence: EvidenceLink[];
}

export interface UpdateRelationshipRequest {
  status: 'confirmed' | 'rejected';
}

/** GET /api/v1/graph?focus=…&depth=…&types=…&status=… */
export interface GraphQuery {
  focus?: Id;
  depth?: 1 | 2;
  types?: EntityType[];
  include_candidates?: boolean;
  project_id?: Id;
  source_id?: Id;
}

export interface GraphResponse {
  focus: Pick<Entity, 'id' | 'canonical_name' | 'entity_type'> | null;
  depth: 1 | 2;
  nodes: Entity[];
  edges: Relationship[];
  counts: {
    by_type: Record<EntityType, number>;
    by_relation: Record<RelationType, number>;
    confirmed: number;
    candidate: number;
  };
}

/** GET /api/v1/entities/{id} */
export interface EntityDetail extends Entity {
  relationships: RelationshipDetail[];
  mention_count: number;
}

export interface UpdateEntityRequest {
  canonical_name?: string;
  merge_into_id?: Id;
}
