import type { EntityType, GraphQuery, GraphResponse, RelationType, RelationshipDetail } from '@contracts/types';
import { fixtures } from './core/fixtures';
import { fail, failWith, simulate } from './core/http';
import { recordAudit, requireDb } from './core/session';

const MAX_NODES = 150;

/** GET /api/v1/graph — bounded subgraph (depth ≤ 2, ≤ 150 nodes). */
export function getGraph(query: GraphQuery = {}): Promise<GraphResponse> {
  return simulate(() => {
    const db = requireDb();
    if (query.depth && query.depth > 2) failWith('VALIDATION_FAILED', 'Depth can be 1 or 2.', { field: 'depth' });
    const depth = query.depth ?? 2;
    const types = query.types ? new Set<EntityType>(query.types) : null;
    let edges = db.relationships.filter((r) => r.status !== 'rejected' && (query.include_candidates || r.status === 'confirmed'));
    let nodes = db.entities.filter((e) => !types || types.has(e.entity_type));
    if (query.source_id) {
      const touching = new Set(edges.filter((r) => r.evidence.some((ev) => ev.source_id === query.source_id)).flatMap((r) => [r.from_entity_id, r.to_entity_id]));
      nodes = nodes.filter((n) => touching.has(n.id) || n.source_id === query.source_id);
    }
    if (query.focus && depth === 1) {
      const neighbours = new Set([query.focus, ...edges.filter((r) => r.from_entity_id === query.focus || r.to_entity_id === query.focus).flatMap((r) => [r.from_entity_id, r.to_entity_id])]);
      nodes = nodes.filter((n) => neighbours.has(n.id));
    }
    nodes = nodes.slice(0, MAX_NODES);
    const ids = new Set(nodes.map((n) => n.id));
    edges = edges.filter((r) => ids.has(r.from_entity_id) && ids.has(r.to_entity_id));
    const all = db.relationships.filter((r) => r.status !== 'rejected');
    const byType = { paper: 0, method: 0, dataset: 0, claim: 0, concept: 0, project: 0, decision: 0 } as Record<EntityType, number>;
    for (const n of db.entities) byType[n.entity_type] += 1;
    const byRelation = { uses_method: 0, evaluates_on: 0, supports: 0, contradicts: 0, supersedes: 0, derived_from: 0, contains: 0 } as Record<RelationType, number>;
    for (const r of all) byRelation[r.relation_type] += 1;
    const focus = db.entities.find((e) => e.id === query.focus) ?? null;
    return {
      focus: focus ? { id: focus.id, canonical_name: focus.canonical_name, entity_type: focus.entity_type } : null,
      depth,
      nodes,
      edges: edges.map(({ from: _f, to: _t, evidence: _e, ...rest }) => rest),
      counts: {
        by_type: byType,
        by_relation: byRelation,
        confirmed: all.filter((r) => r.status === 'confirmed').length,
        candidate: all.filter((r) => r.status === 'candidate').length,
      },
    };
  }, { ms: 420 });
}

/** GET /api/v1/relationships — list view helper (candidates first). */
export function listRelationships(): Promise<RelationshipDetail[]> {
  return simulate(() => {
    const db = requireDb();
    return db.relationships
      .filter((r) => r.status !== 'rejected')
      .toSorted((a, b) => (a.status === b.status ? 0 : a.status === 'candidate' ? -1 : 1));
  }, { ms: 320 });
}

/** GET /api/v1/relationships/{id} */
export function getRelationship(id: string): Promise<RelationshipDetail> {
  return simulate(() => {
    const rel = requireDb().relationships.find((r) => r.id === id);
    if (!rel) failWith('NOT_FOUND', 'Relationship not found.');
    return rel;
  }, { ms: 260 });
}

/** PATCH /api/v1/relationships/{id} — confirm or reject a candidate. */
export function reviewRelationship(id: string, status: 'confirmed' | 'rejected'): Promise<RelationshipDetail> {
  return simulate(() => {
    const db = requireDb();
    const rel = db.relationships.find((r) => r.id === id);
    if (!rel) failWith('NOT_FOUND', 'Relationship not found.');
    if (rel.status !== 'candidate') fail(fixtures.graph.conflict, { details: { status: rel.status } });
    rel.status = status;
    // Keep the Matrix in step with the Map (same relationship, PRD §8.4).
    for (const cell of db.matrixCells) for (const p of cell.papers) for (const r of p.relationships) if (r.id === id) r.status = status;
    recordAudit(db, {
      actor_type: 'user',
      category: 'extraction',
      event_type: `relationship.${status}`,
      target_type: 'relationship',
      target_id: id,
      summary: `${status === 'confirmed' ? 'Confirmed' : 'Rejected'} relationship ${rel.from.canonical_name} → ${rel.to.canonical_name}`,
      link: null,
      result: status === 'confirmed' ? 'confirmed' : 'rejected',
    });
    return rel;
  }, { ms: 500 });
}
