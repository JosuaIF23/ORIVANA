import type { MatrixCell, MatrixCellDetail, MatrixQuery, MatrixResponse, RelationshipStatus } from '@contracts/types';
import { nowIso } from '@/lib/clock';
import { fixtures } from './core/fixtures';
import { failWith, simulate } from './core/http';
import { recordAudit, requireDb } from './core/session';
import type { MockDb } from './core/store';

/** Reported metrics are extracted once per cell; the seed carries them. */
const METRICS: Record<string, string> = Object.fromEntries(
  fixtures.knowledge.matrix.cells.filter((c) => c.metric).map((c) => [`${c.method_id}|${c.dataset_id}`, c.metric as string]),
);

/** A paper counts as confirmed in a cell only when both of its relationships are confirmed. */
function paperStatus(rels: Array<{ status: RelationshipStatus }>): 'confirmed' | 'candidate' | 'rejected' {
  if (rels.some((r) => r.status === 'rejected')) return 'rejected';
  return rels.every((r) => r.status === 'confirmed') ? 'confirmed' : 'candidate';
}

function liveCell(cell: MatrixCellDetail): MatrixCellDetail {
  const papers = cell.papers
    .map((p) => ({ ...p, status: paperStatus(p.relationships) }))
    .filter((p): p is typeof p & { status: 'confirmed' | 'candidate' } => p.status !== 'rejected');
  return { ...cell, papers, is_gap: papers.length === 0 };
}

function yearOk(year: number | null, q: MatrixQuery): boolean {
  if (year === null) return true;
  return (!q.year_from || year >= q.year_from) && (!q.year_to || year <= q.year_to);
}

/** GET /api/v1/knowledge/matrix — derived from USES_METHOD × EVALUATES_ON relationships (PRD §8.4). */
export function getMatrix(query: MatrixQuery = {}): Promise<MatrixResponse> {
  return simulate(() => {
    const db = requireDb();
    const include = Boolean(query.include_candidates);
    const empty: MatrixResponse = { project_id: query.project_id ?? null, include_candidates: include, methods: [], datasets: [], papers: [], cells: [], gap_count: 0, generated_at: nowIso() };
    if (!db.matrixCells.length || (query.project_id && query.project_id !== db.matrixProjectId)) return empty;
    const methods = [...new Map(db.matrixCells.map((c) => [c.method.id, c.method])).values()];
    const datasets = [...new Map(db.matrixCells.map((c) => [c.dataset.id, c.dataset])).values()];
    const papers = [...new Map(db.matrixCells.flatMap((c) => c.papers).map(({ ordinal, source_id, entity_id, label, title, year }) => [ordinal, { ordinal, source_id, entity_id, label, title, year }])).values()].toSorted((a, b) => a.ordinal - b.ordinal);
    const cells: MatrixCell[] = [];
    for (const raw of db.matrixCells) {
      const cell = liveCell(raw);
      const shown = cell.papers.filter((p) => (include || p.status === 'confirmed') && yearOk(p.year, query));
      if (!shown.length) continue;
      cells.push({
        method_id: cell.method.id,
        dataset_id: cell.dataset.id,
        paper_ordinals: shown.map((p) => p.ordinal),
        status: shown.some((p) => p.status === 'confirmed') ? 'confirmed' : 'candidate',
        metric: METRICS[`${cell.method.id}|${cell.dataset.id}`] ?? null,
      });
    }
    return { project_id: db.matrixProjectId, include_candidates: include, methods, datasets, papers, cells, gap_count: methods.length * datasets.length - cells.length, generated_at: nowIso() };
  }, { ms: 420 });
}

function findCell(db: MockDb, methodId: string, datasetId: string): MatrixCellDetail {
  const cell = db.matrixCells.find((c) => c.method.id === methodId && c.dataset.id === datasetId);
  if (!cell) failWith('NOT_FOUND', 'That method or dataset isn’t in this matrix.');
  return cell;
}

/** GET /api/v1/knowledge/matrix/cell?method_id=&dataset_id= */
export function getMatrixCell(methodId: string, datasetId: string): Promise<MatrixCellDetail> {
  return simulate(() => liveCell(findCell(requireDb(), methodId, datasetId)), { ms: 300 });
}

/**
 * PATCH /api/v1/relationships/{id} from the Matrix inspector. Updates the
 * relationship everywhere it appears (Matrix cells and the Map store).
 */
export function reviewMatrixRelationship(relationshipId: string, status: 'confirmed' | 'rejected'): Promise<{ id: string; status: RelationshipStatus }> {
  return simulate(() => {
    const db = requireDb();
    let found = false;
    for (const cell of db.matrixCells) {
      for (const paper of cell.papers) {
        for (const rel of paper.relationships) {
          if (rel.id !== relationshipId) continue;
          if (rel.status !== 'candidate') failWith('CONFLICT', 'This relationship was already reviewed.', { status: rel.status });
          rel.status = status;
          found = true;
        }
      }
    }
    const mapRel = db.relationships.find((r) => r.id === relationshipId);
    if (mapRel) {
      mapRel.status = status;
      found = true;
    }
    if (!found) failWith('NOT_FOUND', 'Relationship not found.');
    recordAudit(db, {
      actor_type: 'user',
      category: 'extraction',
      event_type: `relationship.${status}`,
      target_type: 'relationship',
      target_id: relationshipId,
      summary: `${status === 'confirmed' ? 'Confirmed' : 'Rejected'} a Matrix relationship`,
      link: null,
      result: status,
    });
    return { id: relationshipId, status };
  }, { ms: 420 });
}
