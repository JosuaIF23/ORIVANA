// v2 knowledge views: Matrix (methods × datasets), Claims, and Decision Impact alerts.
// Story (UI.md §13, PRD Flow E): decision D-04 "Use hybrid retrieval for thesis experiments"
// depends on the claim "Hybrid retrieval outperforms dense-only retrieval on open-domain QA",
// supported by Santos & Lee 2025 (p. 4) and Okafor et al. 2025 (p. 6), and newly
// contradicted by Varga & Chen 2024 (p. 9, §5), imported from Zotero.
import { PASSAGES } from './passages.mjs';
import { RELATIONSHIPS, evidenceFor, inline } from './graph.mjs';
import { SOURCES } from './sources.mjs';
import { t, write, error, NOW } from './lib.mjs';

const RAG = { project_id: 'prj_rag', project_name: 'RAG Comparison' };
const srcById = Object.fromEntries(SOURCES.map((s) => [s.id, s]));
const relById = Object.fromEntries(RELATIONSHIPS.map((r) => [r.id, r]));

// --- Matrix -------------------------------------------------------------------

const METHODS = [
  { id: 'ent_m_bm25', name: 'BM25' },
  { id: 'ent_m_dense', name: 'Dense retrieval' },
  { id: 'ent_m_hybrid', name: 'Hybrid retrieval' },
  { id: 'ent_m_graphrag', name: 'GraphRAG' },
];

const DATASETS = [
  { id: 'ent_d_nq', name: 'Natural Questions' },
  { id: 'ent_d_triviaqa', name: 'TriviaQA' },
  { id: 'ent_d_hotpotqa', name: 'HotpotQA' },
  { id: 'ent_d_beir', name: 'BEIR' },
];

// Relationships that place papers on the matrix. Ids that exist in the Map reuse its
// relationship (and its status); the others are outside the focused Map subgraph (SCREENS.md #19).
// [rel_id, relation, entity_id, status, confidence, passage keys]
const PAPER_LINKS = {
  src_santos2025: {
    entity_id: 'ent_p_santos',
    links: [
      ['rel_santos_bm25', 'uses_method', 'ent_m_bm25'],
      ['rel_mx_santos_dense', 'uses_method', 'ent_m_dense', 'confirmed', 0.9, ['santos_p4']],
      ['rel_santos_hybrid', 'uses_method', 'ent_m_hybrid'],
      ['rel_santos_nq', 'evaluates_on', 'ent_d_nq'],
    ],
  },
  src_okafor2025: {
    entity_id: 'ent_p_okafor',
    links: [
      ['rel_mx_okafor_bm25', 'uses_method', 'ent_m_bm25', 'confirmed', 0.91, ['okafor_p6']],
      ['rel_mx_okafor_dense', 'uses_method', 'ent_m_dense', 'confirmed', 0.92, ['okafor_p6']],
      ['rel_okafor_hybrid', 'uses_method', 'ent_m_hybrid'],
      ['rel_mx_okafor_nq', 'evaluates_on', 'ent_d_nq', 'confirmed', 0.93, ['okafor_p5']],
      ['rel_okafor_triviaqa', 'evaluates_on', 'ent_d_triviaqa'],
      ['rel_okafor_beir', 'evaluates_on', 'ent_d_beir'],
    ],
  },
  src_varga2024: {
    entity_id: 'ent_p_varga',
    links: [
      ['rel_varga_dense', 'uses_method', 'ent_m_dense'],
      ['rel_varga_hybrid', 'uses_method', 'ent_m_hybrid'],
      ['rel_varga_hotpotqa', 'evaluates_on', 'ent_d_hotpotqa'],
    ],
  },
  src_ito2025: {
    entity_id: 'ent_p_ito',
    links: [
      ['rel_ito_graphrag', 'uses_method', 'ent_m_graphrag'],
      ['rel_ito_hotpotqa', 'evaluates_on', 'ent_d_hotpotqa'],
    ],
  },
};

const METRICS = {
  'ent_m_hybrid|ent_d_nq': '+3.6 to +4.1 top-20',
  'ent_m_hybrid|ent_d_triviaqa': '+2.9 top-20',
};

const RELATED_CLAIMS = {
  ent_m_hybrid: ['ent_c_hybridbeats'],
  ent_m_dense: ['ent_c_hybridbeats'],
  ent_m_bm25: ['ent_c_lexicalaids'],
};

function linkRel([id, relation_type, target, status, confidence, passages]) {
  const existing = relById[id];
  if (existing) {
    return { id, relation_type, target, status: existing.status, confidence: existing.confidence, evidence: existing._evidence };
  }
  return { id, relation_type, target, status, confidence, evidence: evidenceFor(id, passages) };
}

const PAPERS = Object.entries(PAPER_LINKS).map(([source_id, { entity_id, links }], i) => {
  const s = srcById[source_id];
  return {
    ordinal: i + 1,
    source_id,
    entity_id,
    label: s.short_label,
    title: s.title,
    year: s.year,
    _links: links.map(linkRel),
  };
});

function cellPapers(methodId, datasetId) {
  const out = [];
  for (const paper of PAPERS) {
    const m = paper._links.find((l) => l.target === methodId);
    const d = paper._links.find((l) => l.target === datasetId);
    if (!m || !d) continue;
    const rels = [m, d];
    const seen = new Set();
    const evidence = rels.flatMap((r) => r.evidence).filter((e) => (seen.has(e.chunk_id + e.quote) ? false : seen.add(e.chunk_id + e.quote)));
    const { _links, ...rest } = paper;
    out.push({
      ...rest,
      status: rels.every((r) => r.status === 'confirmed') ? 'confirmed' : 'candidate',
      relationships: rels.map((r) => ({ id: r.id, relation_type: r.relation_type, status: r.status, confidence: r.confidence })),
      evidence,
    });
  }
  return out;
}

export const MATRIX_CELLS = METHODS.flatMap((method) =>
  DATASETS.map((dataset) => {
    const papers = cellPapers(method.id, dataset.id);
    return {
      method,
      dataset,
      is_gap: papers.length === 0,
      papers,
      metric: METRICS[`${method.id}|${dataset.id}`] ?? null,
      related_claim_ids: [...(RELATED_CLAIMS[method.id] ?? []), ...(dataset.id === 'ent_d_hotpotqa' && method.id !== 'ent_m_bm25' ? ['ent_c_gapcloses'] : [])],
    };
  }),
);

/** Builds GET /knowledge/matrix from cell details (the mock service does the same). */
function matrixResponse(includeCandidates) {
  const cells = [];
  for (const c of MATRIX_CELLS) {
    const papers = c.papers.filter((p) => includeCandidates || p.status === 'confirmed');
    if (!papers.length) continue;
    cells.push({
      method_id: c.method.id,
      dataset_id: c.dataset.id,
      paper_ordinals: papers.map((p) => p.ordinal),
      status: papers.some((p) => p.status === 'confirmed') ? 'confirmed' : 'candidate',
      metric: c.metric,
    });
  }
  return {
    ...{ project_id: RAG.project_id },
    include_candidates: includeCandidates,
    methods: METHODS,
    datasets: DATASETS,
    papers: PAPERS.map(({ _links, ...p }) => p),
    cells,
    gap_count: METHODS.length * DATASETS.length - cells.length,
    generated_at: NOW,
  };
}

// --- Claims -------------------------------------------------------------------

const LABEL = (id) => srcById[id].short_label;

function stance(relId, stanceKind, sourceId, status, confidence, passages) {
  const rel = relById[relId];
  const s = srcById[sourceId];
  return {
    relationship_id: relId,
    stance: stanceKind,
    status: rel?.status ?? status,
    confidence: rel ? rel.confidence : confidence,
    source_id: sourceId,
    source_label: s.short_label,
    source_title: s.title,
    imported_at: s.type === 'zotero' ? s.created_at : null,
    evidence: rel ? rel._evidence : evidenceFor(relId, passages),
  };
}

const mention = (sourceId, page, section, passage, quote) => inline(sourceId, LABEL(sourceId), page, section, passage, quote);

const D04 = { id: 'dec_rag_04', code: 'D-04', title: 'Use hybrid retrieval for thesis experiments', review_state: 'needs_review' };
const D05 = { id: 'dec_rag_05', code: 'D-05', title: 'Add the HotpotQA multi-hop split to the evaluation', review_state: 'ok' };

const CLAIM_ROWS = [
  {
    id: 'ent_c_hybridbeats',
    statement: 'Hybrid retrieval outperforms dense-only retrieval on open-domain QA',
    short_name: 'Hybrid beats dense-only',
    status: 'confirmed',
    used_by: [D04],
    has_new_contradiction: true,
    created_at: t('10:00', 1),
    updated_at: t('16:44', 10),
    context_note: 'The contradiction is specific to multi-hop questions (HotpotQA). Both supporting papers evaluate single-hop open-domain QA (Natural Questions, TriviaQA, BEIR).',
    merge: [{ id: 'ent_c_fusionnq', statement: 'BM25 + dense fusion improves top-20 accuracy on Natural Questions' }],
    evidence: [
      stance('rel_santos_hybridbeats', 'supports', 'src_santos2025'),
      stance('rel_okafor_hybridbeats', 'supports', 'src_okafor2025'),
      stance('rel_varga_contradicts', 'contradicts', 'src_varga2024'),
      stance('rel_cl_kowalski_hb', 'mentions', 'src_kowalski2024', 'confirmed', 0.81, [
        mention('src_kowalski2024', 2, '2 Background', 'Several recent systems fuse lexical and dense rankings and report gains over a single dense retriever on open-domain QA benchmarks.', 'fuse lexical and dense rankings and report gains over a single dense retriever'),
      ]),
      stance('rel_cl_nakamura_hb', 'mentions', 'src_nakamura2025', 'confirmed', 0.77, [
        mention('src_nakamura2025', 1, '1 Introduction', 'Sparse–dense hybrids are widely reported to beat dense-only retrievers on English open-domain QA; we ask whether this holds in low-resource domains.', 'Sparse–dense hybrids are widely reported to beat dense-only retrievers'),
      ]),
      stance('rel_cl_costa_hb', 'mentions', 'src_costa2024', 'candidate', 0.69, [
        mention('src_costa2024', 3, '2 Related work', 'Hybrid search engines combine an inverted index with a vector index; open-domain QA results generally favour the combination.', 'open-domain QA results generally favour the combination'),
      ]),
    ],
  },
  {
    id: 'ent_c_gapcloses',
    statement: 'The hybrid advantage disappears on multi-hop questions',
    short_name: 'Gap closes on multi-hop',
    status: 'candidate',
    used_by: [D05],
    has_new_contradiction: false,
    created_at: t('16:44', 10),
    updated_at: t('16:44', 10),
    context_note: null,
    merge: [],
    evidence: [
      stance('rel_cl_varga_gapcloses', 'supports', 'src_varga2024', 'candidate', 0.71, ['varga_p9']),
      stance('rel_cl_fischer_gapcloses', 'mentions', 'src_fischer2024', 'confirmed', 0.74, [
        mention('src_fischer2024', 2, '1 Introduction', 'Multi-hop questions need evidence from several documents, so lexical overlap with the question is a weaker signal than in single-hop QA.', 'lexical overlap with the question is a weaker signal than in single-hop QA'),
      ]),
    ],
  },
  {
    id: 'ent_c_lexicalaids',
    statement: 'Lexical matching helps most for questions with rare entity names',
    short_name: 'Lexical aids rare names',
    status: 'confirmed',
    used_by: [D04],
    has_new_contradiction: false,
    created_at: t('09:15', 3),
    updated_at: t('09:15', 3),
    context_note: null,
    merge: [],
    evidence: [
      stance('rel_okafor_lexical', 'supports', 'src_okafor2025'),
      stance('rel_cl_osei_lexical', 'mentions', 'src_osei2025', 'confirmed', 0.83, [
        mention('src_osei2025', 4, '3 Method', 'Long-tail entities are often split into rare sub-word tokens, which exact-match retrieval handles better than dense embeddings.', 'exact-match retrieval handles better than dense embeddings'),
      ]),
    ],
  },
  {
    id: 'ent_c_longchunks',
    statement: 'Long chunks hurt retrieval recall',
    short_name: 'Long chunks hurt recall',
    status: 'candidate',
    used_by: [],
    has_new_contradiction: false,
    created_at: t('13:58'),
    updated_at: t('13:58'),
    context_note: 'Meyer 2024 uses a late-interaction retriever, which localises the relevant span by token; Daly 2025 uses a single-vector dense retriever.',
    merge: [],
    evidence: [
      stance('rel_daly_longchunks', 'supports', 'src_daly2025'),
      stance('rel_cl_meyer_longchunks', 'contradicts', 'src_meyer2024', 'candidate', 0.66, ['meyer_p11']),
    ],
  },
  {
    id: 'ent_c_fusionnq',
    statement: 'BM25 + dense fusion improves top-20 accuracy on Natural Questions',
    short_name: 'Fusion improves NQ',
    status: 'candidate',
    used_by: [],
    has_new_contradiction: false,
    created_at: t('15:30', 1),
    updated_at: t('15:30', 1),
    context_note: null,
    merge: [{ id: 'ent_c_hybridbeats', statement: 'Hybrid retrieval outperforms dense-only retrieval on open-domain QA' }],
    evidence: [stance('rel_cl_santos_fusionnq', 'supports', 'src_santos2025', 'candidate', 0.79, ['santos_p4'])],
  },
];

export const CLAIMS = CLAIM_ROWS.map((c) => {
  const count = (k) => new Set(c.evidence.filter((e) => e.stance === k).map((e) => e.source_id)).size;
  return {
    id: c.id,
    ...RAG,
    statement: c.statement,
    short_name: c.short_name,
    status: c.status,
    supports_count: count('supports'),
    contradicts_count: count('contradicts'),
    mentions_count: count('mentions'),
    used_by_decisions: c.used_by,
    has_new_contradiction: c.has_new_contradiction,
    created_at: c.created_at,
    updated_at: c.updated_at,
    _detail: {
      evidence: c.evidence,
      context_note: c.context_note ? { text: c.context_note, generated_by: 'model' } : null,
      merge_suggestions: c.merge,
    },
  };
});

export const claimById = Object.fromEntries(CLAIMS.map((c) => [c.id, c]));

export function claimDetail(c) {
  const { _detail, ...rest } = c;
  return { ...rest, ..._detail };
}

export const claimSummary = ({ _detail, ...rest }) => rest;

// --- Decision Impact alert ------------------------------------------------------

function alertEvidence(sourceId, passageKey) {
  const s = srcById[sourceId];
  const [passage] = evidenceFor(`alert_${passageKey}`, [passageKey]);
  return { source_id: sourceId, source_label: s.short_label, source_title: s.title, imported_at: s.type === 'zotero' ? s.created_at : null, passage };
}

export const ALERT = {
  id: 'alert_01JCD04VRG',
  workspace_id: 'ws_personal',
  ...RAG,
  memory_id: 'dec_rag_04',
  decision_code: 'D-04',
  decision_title: 'Use hybrid retrieval for thesis experiments',
  decision_statement: 'Use hybrid retrieval (BM25 + dense, RRF k = 60) for every thesis experiment.',
  decision_rationale: 'Two papers report consistent gains over dense-only on NQ and TriviaQA, largest under distribution shift.',
  decided_at: t('10:00', 6),
  claim_id: 'ent_c_hybridbeats',
  claim_statement: 'Hybrid retrieval outperforms dense-only retrieval on open-domain QA',
  previous_support: { supports_count: 2, contradicts_count: 0 },
  trigger_source_id: 'src_varga2024',
  trigger_source_label: 'Varga & Chen 2024',
  trigger_relationship_id: 'rel_varga_contradicts',
  severity: 'weakens',
  reason: 'Varga & Chen 2024 find no gain from hybrid retrieval over a tuned dense retriever on HotpotQA. Your thesis experiments include multi-hop questions (D-05 proposes adding the HotpotQA split), so the decision may not hold for part of the evaluation.',
  confidence: 0.78,
  status: 'open',
  resolution: null,
  previous_evidence: [alertEvidence('src_santos2025', 'santos_p4'), alertEvidence('src_okafor2025', 'okafor_p6')],
  new_evidence: [alertEvidence('src_varga2024', 'varga_p9')],
  proposal_id: null,
  trigger_source_deleted: false,
  detected_at: t('16:45', 10),
  updated_at: t('16:45', 10),
};

export function generateKnowledge() {
  write('knowledge/matrix.prj_rag.200.json', { _note: 'GET /api/v1/knowledge/matrix?project_id=prj_rag (confirmed only, the default)', ...matrixResponse(false) });
  write('knowledge/matrix.prj_rag.candidates.200.json', { _note: 'GET /api/v1/knowledge/matrix?project_id=prj_rag&include_candidates=true', ...matrixResponse(true) });
  write('knowledge/matrix-cells.200.json', {
    _note: 'Mock store seed: GET /api/v1/knowledge/matrix/cell?method_id=&dataset_id= for every pair (gaps included), with candidate papers.',
    items: MATRIX_CELLS.map(({ metric, ...c }) => c),
  });
  write('knowledge/matrix.empty.200.json', { project_id: null, include_candidates: false, methods: [], datasets: [], papers: [], cells: [], gap_count: 0, generated_at: NOW });
  write('claims/list.200.json', { _note: 'GET /api/v1/claims?project_id=prj_rag&sort=most_contested', items: CLAIMS.map(claimSummary), next_cursor: null, total: CLAIMS.length });
  write('claims/detail.200.json', { _note: 'GET /api/v1/claims/{id} keyed by id.', items: Object.fromEntries(CLAIMS.map((c) => [c.id, claimDetail(c)])) });
  write('claims/patch.confirm.200.json', { ...claimDetail(claimById.ent_c_gapcloses), status: 'confirmed', updated_at: NOW });
  write('claims/patch.409-already-decided.json', error('CONFLICT', 'This claim was already reviewed.', 'req_3c4d5e6f', { status: 'confirmed' }));
  write('decision-alerts/list.open.200.json', { items: [ALERT], next_cursor: null, total: 1, counts: { open: 1, dismissed: 0, resolved: 0 } });
  write('decision-alerts/get.alert_01JCD04VRG.200.json', ALERT);
  write('decision-alerts/patch.dismissed.200.json', {
    ...ALERT,
    status: 'dismissed',
    resolution: { kind: 'kept', note: 'Multi-hop is out of scope for Chapter 4; keep hybrid for single-hop experiments.', by: 'usr_josua', at: NOW, replacement_memory_id: null, proposal_id: null },
    updated_at: NOW,
  });
  write('decision-alerts/patch.422-note-required.json', error('VALIDATION_FAILED', 'Add a short note on why you keep this decision.', 'req_9d8c7b6a', { field: 'resolution_note' }));
  write('decision-alerts/propose-action.201.json', { alert: { ...ALERT, proposal_id: 'prop_01JCD04ALT' }, proposal_id: 'prop_01JCD04ALT' });
  write('decision-alerts/list.empty.200.json', { items: [], next_cursor: null, total: 0, counts: { open: 0, dismissed: 0, resolved: 0 } });
}

export { METHODS, DATASETS, PASSAGES };
