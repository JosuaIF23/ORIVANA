// Memories (11) and decision records (7) for the Memory screen and project timeline.
import { t, tOct, write, error } from './lib.mjs';

const RAG = { project_id: 'prj_rag', project_name: 'RAG Comparison' };
const THESIS = { project_id: 'prj_thesis', project_name: 'Thesis Proposal' };

const conv = (id, label) => ({ kind: 'conversation', label, conversation_id: id, source_id: null, page: null });
const src = (id, label, page) => ({ kind: 'source', label, conversation_id: null, source_id: id, page });
const user = (label = 'Added by you') => ({ kind: 'user', label, conversation_id: null, source_id: null, page: null });

function memory(id, fields) {
  return {
    id,
    workspace_id: 'ws_personal',
    project_id: null,
    project_name: null,
    confidence: null,
    supersedes_id: null,
    superseded_by_id: null,
    valid_from: fields.created_at,
    valid_to: null,
    updated_at: fields.created_at,
    decision: null,
    ...fields,
  };
}

export const MEMORIES = [
  memory('mem_rerun_eval', { ...RAG, memory_type: 'project', content: 'Re-run the eval with hybrid retrieval before the 20 Nov supervisor meeting.', origin: 'model_proposed', status: 'candidate', confidence: 0.81, evidence: conv('conv_hybrid', 'Conversation · Hybrid vs dense-only results'), created_at: t('14:22') }),
  memory('mem_report_metrics', { ...RAG, memory_type: 'procedural', content: 'Report both top-20 accuracy and nDCG@10 for every retrieval run.', origin: 'model_proposed', status: 'candidate', confidence: 0.74, evidence: conv('conv_evalplan', 'Conversation · Eval plan for chunk sizes'), created_at: t('10:42', 9) }),
  memory('mem_hotpotqa_splits', { ...RAG, memory_type: 'semantic', content: 'HotpotQA results are not comparable across papers because they use different splits.', origin: 'model_proposed', status: 'candidate', confidence: 0.58, evidence: src('src_varga2024', 'Varga & Chen 2024 · p. 9', 9), created_at: t('14:22') }),
  memory('mem_chunking_384', { ...RAG, memory_type: 'procedural', content: 'Default chunking: 384 tokens with a 64-token overlap.', origin: 'model_proposed', status: 'confirmed', confidence: 0.86, supersedes_id: 'mem_chunking_512', evidence: conv('conv_evalplan', 'Conversation · Eval plan for chunk sizes'), created_at: tOct('11:00', 30) }),
  memory('mem_eval_set', { ...RAG, memory_type: 'project', content: 'Evaluation set: 32 papers and 80 questions, including 12 no-answer questions.', origin: 'user', status: 'confirmed', evidence: user(), created_at: tOct('15:20', 28) }),
  memory('mem_supervisor_q1', { ...THESIS, memory_type: 'episodic', content: 'Supervisor meeting: focus the thesis on graph-aware retrieval (research question Q1).', origin: 'user', status: 'confirmed', evidence: user('Added by you · 4 Nov'), created_at: t('14:30', 4) }),
  memory('mem_okafor_beir', { ...RAG, memory_type: 'semantic', content: 'Okafor et al. 2025 evaluates distribution shift on BEIR subsets.', origin: 'imported', status: 'confirmed', confidence: 0.92, evidence: src('src_okafor2025', 'Okafor et al. 2025 · p. 5', 5), created_at: t('09:15', 3) }),
  memory('mem_markdown_notes', { memory_type: 'procedural', content: 'Keep lab notes in Markdown so they can be uploaded as sources.', origin: 'user', status: 'confirmed', evidence: user(), created_at: tOct('09:00', 20) }),
  memory('mem_chunking_512', { ...RAG, memory_type: 'procedural', content: 'Default chunking: 512 tokens with no overlap.', origin: 'user', status: 'superseded', superseded_by_id: 'mem_chunking_384', valid_to: tOct('11:00', 30), evidence: user(), created_at: tOct('10:00', 12) }),
  memory('mem_dense_always', { ...RAG, memory_type: 'semantic', content: 'Dense retrieval always outperforms BM25.', origin: 'model_proposed', status: 'rejected', confidence: 0.41, evidence: conv('conv_graphrag', 'Conversation · GraphRAG community summaries'), created_at: t('14:45', 9) }),
  memory('mem_prefers_graphrag', { memory_type: 'episodic', content: 'You prefer GraphRAG for every project.', origin: 'model_proposed', status: 'rejected', confidence: 0.33, evidence: conv('conv_readinglist', 'Conversation · Reading list for retrieval eval'), created_at: t('16:05', 2) }),
];

function decision(id, code, title, fields) {
  return memory(id, {
    memory_type: 'project',
    content: title,
    decision: { code, title, rationale: fields.rationale ?? null, evidence: fields.evidence ?? [] },
    ...fields,
  });
}

export const DECISIONS = [
  decision('dec_rag_05', 'D-05', 'Add the HotpotQA multi-hop split to the evaluation', {
    ...RAG, origin: 'model_proposed', status: 'candidate', confidence: 0.7, created_at: t('09:40'),
    rationale: 'one source finds the hybrid advantage disappears on multi-hop questions; our set has none.',
    evidence: [{ source_id: 'src_varga2024', label: 'Varga & Chen 2024', page: 9 }],
    evidence_ref: undefined,
  }),
  decision('dec_rag_04', 'D-04', 'Use hybrid retrieval (BM25 + dense, RRF k = 60) as the default retriever', {
    ...RAG, origin: 'user', status: 'confirmed', supersedes_id: 'dec_rag_02', created_at: t('10:00', 6),
    rationale: 'two papers report consistent gains over dense-only on NQ and TriviaQA, largest under distribution shift.',
    evidence: [{ source_id: 'src_okafor2025', label: 'Okafor et al. 2025', page: 6 }, { source_id: 'src_santos2025', label: 'Santos & Lee 2025', page: 4 }],
  }),
  decision('dec_rag_03', 'D-03', 'Evaluate every run with top-20 accuracy and nDCG@10', { ...RAG, origin: 'user', status: 'confirmed', created_at: tOct('14:00', 28) }),
  decision('dec_rag_02', 'D-02', 'Use dense-only retrieval as the default retriever', { ...RAG, origin: 'user', status: 'superseded', superseded_by_id: 'dec_rag_04', valid_to: t('10:00', 6), created_at: tOct('10:00', 14) }),
  decision('dec_rag_01', 'D-01', 'Limit the corpus to papers from 2023 onwards', { ...RAG, origin: 'user', status: 'confirmed', created_at: tOct('09:00', 2) }),
  decision('dec_thesis_02', 'D-02', 'Use the RAG Comparison results as the Chapter 4 baseline', { ...THESIS, origin: 'user', status: 'confirmed', created_at: t('19:52', 8) }),
  decision('dec_thesis_01', 'D-01', 'Focus the thesis on graph-aware retrieval (Q1)', { ...THESIS, origin: 'user', status: 'confirmed', created_at: t('14:30', 4) }),
].map((d) => {
  const { evidence_ref, ...rest } = d;
  const ev = rest.decision.evidence[0];
  return {
    ...rest,
    evidence: ev ? { kind: 'source', label: `${ev.label} · p. ${ev.page}`, conversation_id: null, source_id: ev.source_id, page: ev.page } : user(),
  };
});

function counts(list) {
  const c = { candidate: 0, confirmed: 0, superseded: 0, rejected: 0 };
  for (const m of list) c[m.status] += 1;
  return c;
}

export function generateMemories() {
  write('memories/list.200.json', { _note: 'GET /api/v1/memories (decision records excluded; use decisions_only=true).', items: MEMORIES, next_cursor: null, total: MEMORIES.length, counts: counts(MEMORIES) });
  write('memories/decisions.200.json', { _note: 'GET /api/v1/memories?decisions_only=true', items: DECISIONS, next_cursor: null, total: DECISIONS.length, counts: counts(DECISIONS) });
  write('memories/create.201.json', memory('mem_new_01', { ...RAG, memory_type: 'procedural', content: 'Use a fixed random seed (13) for every evaluation run.', origin: 'user', status: 'confirmed', evidence: user(), created_at: t('15:10') }));
  write('memories/patch.confirm.200.json', { ...MEMORIES[0], status: 'confirmed', updated_at: t('15:10') });
  write('memories/patch.reject.200.json', { ...MEMORIES[0], status: 'rejected', updated_at: t('15:10') });
  write('memories/patch.edit.200.json', { ...MEMORIES[0], content: 'Re-run the eval with hybrid retrieval before the 20 Nov supervisor meeting, including the HotpotQA split.', origin: 'user', updated_at: t('15:10') });
  write('memories/patch.supersede.200.json', { ...MEMORIES[3], status: 'superseded', superseded_by_id: 'mem_new_01', valid_to: t('15:10'), updated_at: t('15:10') });
  write('memories/patch.422-invalid.json', error('VALIDATION_FAILED', 'Choose a confirmed memory to supersede this one.', 'req_6a7b8c9d', { field: 'superseded_by_id' }));
  write('memories/delete.200.json', { ok: true });
  write('memories/delete-candidates.200.json', { deleted: 3 });
}
