// Knowledge graph: 25 entities and 30 relationships in RAG Comparison (5 candidates).
import { PASSAGES } from './passages.mjs';
import { t, write, error, span } from './lib.mjs';

// [id, name, type, source_id, status]
const ENTITY_ROWS = [
  ['ent_p_varga', 'Varga & Chen 2024', 'paper', 'src_varga2024'],
  ['ent_p_ito', 'Ito 2025', 'paper', 'src_ito2025'],
  ['ent_p_meyer', 'Meyer 2024', 'paper', 'src_meyer2024'],
  ['ent_p_daly', 'Daly 2025', 'paper', 'src_daly2025'],
  ['ent_p_santos', 'Santos & Lee 2025', 'paper', 'src_santos2025'],
  ['ent_p_okafor', 'Okafor et al. 2025', 'paper', 'src_okafor2025'],
  ['ent_m_graphrag', 'GraphRAG', 'method', 'src_ito2025'],
  ['ent_m_dense', 'Dense retrieval', 'method', null],
  ['ent_m_bm25', 'BM25', 'method', null],
  ['ent_m_hybrid', 'Hybrid retrieval', 'method', null],
  ['ent_m_rrf', 'RRF', 'method', 'src_santos2025'],
  ['ent_d_hotpotqa', 'HotpotQA', 'dataset', null],
  ['ent_d_nq', 'Natural Questions', 'dataset', null],
  ['ent_d_triviaqa', 'TriviaQA', 'dataset', null],
  ['ent_d_beir', 'BEIR', 'dataset', null],
  ['ent_c_gapcloses', 'Gap closes on multi-hop', 'claim', 'src_varga2024'],
  ['ent_c_longchunks', 'Long chunks hurt recall', 'claim', 'src_daly2025'],
  ['ent_c_lexicalaids', 'Lexical aids rare names', 'claim', 'src_okafor2025'],
  ['ent_c_hybridbeats', 'Hybrid beats dense-only', 'claim', null],
  ['ent_k_multihop', 'Multi-hop reasoning', 'concept', null],
  ['ent_k_lexical', 'Lexical matching', 'concept', null],
  ['ent_k_shift', 'Distribution shift', 'concept', null],
  ['ent_prj_rag', 'RAG Comparison', 'project', null],
  ['ent_dec_04', 'D-04 Hybrid for thesis experiments', 'decision', null, 'active'],
  ['ent_dec_02', 'D-02 Dense-only default', 'decision', null, 'superseded'],
];

export const ENTITIES = ENTITY_ROWS.map(([id, canonical_name, entity_type, source_id, status = 'active']) => ({
  id,
  workspace_id: 'ws_personal',
  project_id: 'prj_rag',
  canonical_name,
  entity_type,
  status,
  aliases: canonical_name === 'Hybrid retrieval' ? ['BM25 + dense', 'sparse–dense fusion'] : [],
  source_id,
  created_at: t('09:15', 3),
}));

const nameOf = Object.fromEntries(ENTITIES.map((e) => [e.id, e.canonical_name]));
const typeOf = Object.fromEntries(ENTITIES.map((e) => [e.id, e.entity_type]));

// [id, from, relation, to, status, confidence|null(user), passages(keys or inline), extractedDay]
const REL_ROWS = [
  ['rel_varga_hybrid', 'ent_p_varga', 'uses_method', 'ent_m_hybrid', 'candidate', 0.72, ['varga_p3', 'varga_p9_graph'], 10],
  ['rel_varga_contradicts', 'ent_p_varga', 'contradicts', 'ent_c_hybridbeats', 'candidate', 0.64, ['varga_p9_graph'], 10],
  ['rel_daly_dense', 'ent_p_daly', 'uses_method', 'ent_m_dense', 'candidate', 0.69, [inline('src_daly2025', 'Daly 2025', 3, '3 Method', 'All runs use a 110M-parameter dense bi-encoder fine-tuned on the training split.', 'dense bi-encoder')], 11],
  ['rel_daly_longchunks', 'ent_p_daly', 'supports', 'ent_c_longchunks', 'candidate', 0.77, ['daly_p7', inline('src_daly2025', 'Daly 2025', 12, '5 Discussion', 'Shorter chunks consistently retrieve the answer-bearing sentence more often than long ones.', 'Shorter chunks consistently retrieve the answer-bearing sentence more often')], 11],
  ['rel_ito_hotpotqa', 'ent_p_ito', 'evaluates_on', 'ent_d_hotpotqa', 'candidate', 0.58, [inline('src_ito2025', 'Ito 2025', 7, '4 Experiments', 'We also report a small comparison on 500 HotpotQA questions to probe multi-hop behaviour.', '500 HotpotQA questions')], 11],
  ['rel_okafor_hybrid', 'ent_p_okafor', 'uses_method', 'ent_m_hybrid', 'confirmed', 0.94, ['okafor_p6', 'okafor_p5', 'okafor_p6_after'], 3],
  ['rel_okafor_triviaqa', 'ent_p_okafor', 'evaluates_on', 'ent_d_triviaqa', 'confirmed', 0.91, ['okafor_p6', 'okafor_p5'], 3],
  ['rel_okafor_hybridbeats', 'ent_p_okafor', 'supports', 'ent_c_hybridbeats', 'confirmed', 0.88, ['okafor_p6', 'okafor_p10'], 3],
  ['rel_santos_nq', 'ent_p_santos', 'evaluates_on', 'ent_d_nq', 'confirmed', 0.93, ['santos_p4', inline('src_santos2025', 'Santos & Lee 2025', 2, '2 Setup', 'We use the Natural Questions open-domain split with the standard 21M-passage Wikipedia index.', 'Natural Questions open-domain split')], 1],
  ['rel_dec04_supersedes', 'ent_dec_04', 'supersedes', 'ent_dec_02', 'confirmed', null, [], 6],
  ['rel_dec04_okafor', 'ent_dec_04', 'derived_from', 'ent_p_okafor', 'confirmed', null, ['okafor_p6'], 6],
  ['rel_rag_santos', 'ent_prj_rag', 'contains', 'ent_p_santos', 'confirmed', null, [], 1],
  ['rel_okafor_lexical', 'ent_p_okafor', 'supports', 'ent_c_lexicalaids', 'confirmed', 0.9, ['okafor_p6', 'okafor_p10'], 3],
  ['rel_okafor_beir', 'ent_p_okafor', 'evaluates_on', 'ent_d_beir', 'confirmed', 0.89, ['okafor_p5'], 3],
  ['rel_okafor_rrf', 'ent_p_okafor', 'uses_method', 'ent_m_rrf', 'confirmed', 0.86, ['okafor_p6'], 3],
  ['rel_santos_bm25', 'ent_p_santos', 'uses_method', 'ent_m_bm25', 'confirmed', 0.95, ['santos_p4'], 1],
  ['rel_santos_hybrid', 'ent_p_santos', 'uses_method', 'ent_m_hybrid', 'confirmed', 0.93, ['santos_p4'], 1],
  ['rel_santos_hybridbeats', 'ent_p_santos', 'supports', 'ent_c_hybridbeats', 'confirmed', 0.87, ['santos_p4'], 1],
  ['rel_ito_graphrag', 'ent_p_ito', 'uses_method', 'ent_m_graphrag', 'confirmed', 0.96, ['ito_p5'], 11],
  ['rel_meyer_dense', 'ent_p_meyer', 'uses_method', 'ent_m_dense', 'confirmed', 0.84, ['meyer_p11'], 11],
  ['rel_varga_dense', 'ent_p_varga', 'uses_method', 'ent_m_dense', 'confirmed', 0.92, ['varga_p9'], 10],
  ['rel_varga_hotpotqa', 'ent_p_varga', 'evaluates_on', 'ent_d_hotpotqa', 'confirmed', 0.95, ['varga_p9'], 10],
  ['rel_dec04_santos', 'ent_dec_04', 'derived_from', 'ent_p_santos', 'confirmed', null, ['santos_p4'], 6],
  ['rel_varga_multihop', 'ent_p_varga', 'mentions', 'ent_k_multihop', 'confirmed', 0.9, ['varga_p9'], 10],
  ['rel_dec02_meyer', 'ent_dec_02', 'derived_from', 'ent_p_meyer', 'confirmed', null, ['meyer_p11'], 10],
  ['rel_rag_okafor', 'ent_prj_rag', 'contains', 'ent_p_okafor', 'confirmed', null, [], 3],
  ['rel_rag_varga', 'ent_prj_rag', 'contains', 'ent_p_varga', 'confirmed', null, [], 10],
  ['rel_rag_daly', 'ent_prj_rag', 'contains', 'ent_p_daly', 'confirmed', null, [], 11],
  ['rel_rag_meyer', 'ent_prj_rag', 'contains', 'ent_p_meyer', 'confirmed', null, [], 11],
  ['rel_rag_ito', 'ent_prj_rag', 'contains', 'ent_p_ito', 'confirmed', null, [], 11],
];

function inline(source_id, source_label, page, section, passage, quote) {
  return { inline: true, chunk_id: `chk_${source_id.slice(4)}_${page}e`, source_id, source_label, page, section, ...span(passage, quote) };
}

const SOURCE_LABEL = {
  src_okafor2025: 'Okafor et al. 2025',
  src_santos2025: 'Santos & Lee 2025',
  src_varga2024: 'Varga & Chen 2024',
  src_ito2025: 'Ito 2025',
  src_daly2025: 'Daly 2025',
  src_meyer2024: 'Meyer 2024',
};

function evidenceFor(relId, items) {
  return items.map((item, i) => {
    const p = typeof item === 'string' ? { ...PASSAGES[item], source_label: SOURCE_LABEL[PASSAGES[item].source_id] } : item;
    return {
      id: `ev_${relId.slice(4)}_${i + 1}`,
      relationship_id: relId,
      memory_id: null,
      chunk_id: p.chunk_id,
      source_id: p.source_id,
      source_label: p.source_label,
      page: p.page,
      section: p.section,
      passage: p.passage,
      quote: p.quote,
      char_start: p.char_start,
      char_end: p.char_end,
    };
  });
}

export { SOURCE_LABEL, inline, evidenceFor, nameOf };

export const RELATIONSHIPS = REL_ROWS.map(([id, from, relation_type, to, status, confidence, passages, day]) => {
  const evidence = evidenceFor(id, passages);
  const user = confidence === null;
  return {
    id,
    workspace_id: 'ws_personal',
    from_entity_id: from,
    to_entity_id: to,
    relation_type,
    confidence,
    status,
    origin: user ? 'user' : status === 'candidate' ? 'model_proposed' : 'model_proposed',
    extraction_method: user ? 'user' : 'model_section',
    // Varga & Chen 2024 was synced from Zotero on 10 Nov 16:40 and extracted at 16:44.
    extracted_at: from === 'ent_p_varga' ? t('16:44', 10) : t('10:00', day),
    valid_from: null,
    valid_to: null,
    evidence_count: evidence.length,
    source_count: new Set(evidence.map((e) => e.source_id)).size,
    _evidence: evidence,
  };
});

export function relationshipDetail(rel) {
  const { _evidence, ...rest } = rel;
  return {
    ...rest,
    from: { id: rel.from_entity_id, canonical_name: nameOf[rel.from_entity_id], entity_type: typeOf[rel.from_entity_id] },
    to: { id: rel.to_entity_id, canonical_name: nameOf[rel.to_entity_id], entity_type: typeOf[rel.to_entity_id] },
    evidence: _evidence,
  };
}

function counts(nodes, edges) {
  const by_type = { paper: 0, method: 0, dataset: 0, claim: 0, concept: 0, project: 0, decision: 0 };
  for (const n of nodes) by_type[n.entity_type] += 1;
  const by_relation = { uses_method: 0, evaluates_on: 0, supports: 0, contradicts: 0, mentions: 0, supersedes: 0, derived_from: 0, contains: 0 };
  for (const e of edges) by_relation[e.relation_type] += 1;
  return {
    by_type,
    by_relation,
    confirmed: edges.filter((e) => e.status === 'confirmed').length,
    candidate: edges.filter((e) => e.status === 'candidate').length,
  };
}

export function generateGraph() {
  const edges = RELATIONSHIPS.map(({ _evidence, ...rest }) => rest);
  write('graph/subgraph.prj_rag.200.json', {
    _note: 'GET /api/v1/graph?focus=ent_prj_rag&depth=2&include_candidates=true',
    focus: { id: 'ent_prj_rag', canonical_name: 'RAG Comparison', entity_type: 'project' },
    depth: 2,
    nodes: ENTITIES,
    edges,
    counts: counts(ENTITIES, edges),
  });
  write('graph/subgraph.empty.200.json', {
    focus: null,
    depth: 2,
    nodes: [],
    edges: [],
    counts: counts([], []),
  });
  write('relationships/detail.200.json', {
    _note: 'GET /api/v1/relationships/{id} keyed by id.',
    items: Object.fromEntries(RELATIONSHIPS.map((r) => [r.id, relationshipDetail(r)])),
  });
  const confirmed = relationshipDetail(RELATIONSHIPS[0]);
  write('relationships/patch.confirm.200.json', { ...confirmed, status: 'confirmed', origin: 'model_proposed' });
  write('relationships/patch.reject.200.json', { ...confirmed, status: 'rejected' });
  write('relationships/patch.409-already-decided.json', error('CONFLICT', 'This relationship was already reviewed.', 'req_5e6f7a80', { status: 'confirmed' }));
  const hybrid = ENTITIES.find((e) => e.id === 'ent_m_hybrid');
  write('entities/ent_m_hybrid.200.json', {
    ...hybrid,
    mention_count: 23,
    relationships: RELATIONSHIPS.filter((r) => r.to_entity_id === 'ent_m_hybrid' || r.from_entity_id === 'ent_m_hybrid').map(relationshipDetail),
  });
  write('entities/patch.rename.200.json', { ...hybrid, canonical_name: 'Hybrid retrieval (BM25 + dense)' });
}
