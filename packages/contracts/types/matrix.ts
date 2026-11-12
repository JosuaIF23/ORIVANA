import type { Id, ISODateTime } from './common';
import type { EvidenceLink, RelationshipStatus } from './graph';

/** A paper that appears in at least one Matrix cell; `ordinal` is its citation number [n]. */
export interface MatrixPaper {
  ordinal: number;
  source_id: Id;
  entity_id: Id;
  label: string;
  title: string;
  year: number | null;
}

export interface MatrixAxisItem {
  /** Entity id of the Method or Dataset. */
  id: Id;
  name: string;
}

/**
 * One filled cell. A cell is `candidate` when every relationship behind it is
 * still a candidate. Method × dataset pairs without a cell are gaps.
 */
export interface MatrixCell {
  method_id: Id;
  dataset_id: Id;
  paper_ordinals: number[];
  status: Exclude<RelationshipStatus, 'rejected'>;
  /** Reported metric when extracted, e.g. "+3.6 top-20". */
  metric: string | null;
}

/** GET /api/v1/knowledge/matrix?project_id=&include_candidates=&year_from=&year_to= */
export interface MatrixQuery {
  project_id?: Id;
  include_candidates?: boolean;
  year_from?: number;
  year_to?: number;
}

export interface MatrixResponse {
  project_id: Id | null;
  include_candidates: boolean;
  methods: MatrixAxisItem[];
  datasets: MatrixAxisItem[];
  papers: MatrixPaper[];
  cells: MatrixCell[];
  /** Number of method × dataset pairs without evidence. */
  gap_count: number;
  generated_at: ISODateTime;
}

/** Evidence for one paper inside a cell. */
export interface MatrixCellPaper extends MatrixPaper {
  status: Exclude<RelationshipStatus, 'rejected'>;
  /** Relationships (USES_METHOD / EVALUATES_ON) that place the paper in this cell. */
  relationships: Array<{ id: Id; relation_type: 'uses_method' | 'evaluates_on'; status: RelationshipStatus; confidence: number | null }>;
  evidence: EvidenceLink[];
}

/** GET /api/v1/knowledge/matrix/cell?method_id=&dataset_id= */
export interface MatrixCellDetail {
  method: MatrixAxisItem;
  dataset: MatrixAxisItem;
  is_gap: boolean;
  papers: MatrixCellPaper[];
  related_claim_ids: Id[];
}
