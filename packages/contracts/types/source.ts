import type { Id, ISODateTime } from './common';
import type { EntityType, RelationshipStatus, RelationType } from './graph';

export type SourceType = 'pdf' | 'markdown' | 'txt';

/** Processing status shown as a text badge (UI.md §4.7). */
export type SourceStatus = 'queued' | 'parsing' | 'indexing' | 'ready' | 'failed';

export type JobStatus = 'queued' | 'running' | 'succeeded' | 'failed';

/** jobs (PRD §10): mirrors River job state for the UI. */
export interface Job {
  id: Id;
  workspace_id: Id;
  source_id: Id;
  kind: 'ingest';
  status: JobStatus;
  /** Current pipeline stage of the source. */
  stage: SourceStatus;
  attempts: number;
  max_attempts: number;
  progress: { current: number; total: number; unit: 'pages' | 'chunks' } | null;
  eta_seconds: number | null;
  error_code: string | null;
  error_message: string | null;
  started_at: ISODateTime | null;
  finished_at: ISODateTime | null;
}

/** sources (PRD §10) with bibliographic metadata and the latest job. */
export interface Source {
  id: Id;
  workspace_id: Id;
  project_id: Id | null;
  project_name: string | null;
  type: SourceType;
  title: string;
  file_name: string;
  authors: string | null;
  /** Short citation label, e.g. "Okafor et al. 2025". */
  short_label: string;
  year: number | null;
  status: SourceStatus;
  checksum: string;
  size_bytes: number;
  page_count: number | null;
  section_count: number | null;
  chunk_count: number | null;
  created_at: ISODateTime;
  updated_at: ISODateTime;
  job: Job | null;
}

export interface Section {
  id: Id;
  number: string | null;
  title: string;
  page: number;
  level: 1 | 2;
}

export interface IngestionStep {
  label: string;
  status: 'done' | 'failed';
  at: ISODateTime;
}

/** GET /api/v1/sources/{id} */
export interface SourceDetail extends Source {
  sections: Section[];
  entities: Array<{ id: Id; name: string; entity_type: EntityType }>;
  entity_count: number;
  relationships: Array<{
    id: Id;
    relation_type: RelationType;
    target_name: string;
    status: RelationshipStatus;
  }>;
  relationship_count: number;
  ingestion_history: IngestionStep[];
  /** Questions suggested from the paper's content (onboarding step 3). */
  suggested_questions: string[];
}

/** chunks (PRD §10). Offsets are character offsets within the parsed document. */
export interface Chunk {
  id: Id;
  document_id: Id;
  ordinal: number;
  text: string;
  token_count: number;
  page_start: number;
  page_end: number;
  section_path: string[];
  char_start: number;
  char_end: number;
}

/** A block in the page-based document viewer. Paragraphs map 1:1 to chunks. */
export type PageBlock =
  | { type: 'heading'; text: string; level: 1 | 2 }
  | { type: 'paragraph'; chunk_id: Id; text: string }
  | {
      type: 'table';
      caption: string;
      columns: string[];
      rows: string[][];
      /** Index of the row rendered in bold ("best per column"). */
      emphasis_row: number | null;
    };

/** GET /api/v1/sources/{id}/chunks?page=N */
export interface SourcePageResponse {
  source_id: Id;
  page: number;
  page_count: number;
  running_header: string;
  section_id: Id | null;
  blocks: PageBlock[];
  chunks: Chunk[];
}

export interface SourceListQuery {
  q?: string;
  project_id?: Id;
  status?: SourceStatus;
  type?: SourceType;
  cursor?: string;
  limit?: number;
}

export interface SourceListResponse {
  items: Source[];
  next_cursor: string | null;
  total: number;
  workspace_total: number;
}

export interface UploadSourceRequest {
  file_name: string;
  size_bytes: number;
  project_id: Id | null;
}

export interface UploadSourceResponse {
  source: Source;
  job: Job;
}

/** Extension: summary used by the delete confirmation. */
export interface DeleteSourceResponse {
  deleted_source_id: Id;
  removed: { chunks: number; citations: number; evidence_links: number };
  needs_review: { relationships: number; memories: number };
}
