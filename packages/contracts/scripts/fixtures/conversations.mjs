// Conversations, messages with citations, and recorded SSE streams.
import { PASSAGES } from './passages.mjs';
import { t, write, error } from './lib.mjs';

const SOURCE_INFO = {
  src_santos2025: { title: 'Fusion Retrieval Revisited: BM25 + Dense on Open-Domain QA', label: 'Santos & Lee 2025', meta: 'Santos & Lee, 2025' },
  src_okafor2025: { title: 'Hybrid Retrieval Under Distribution Shift', label: 'Okafor et al. 2025', meta: 'Okafor, Brandt & Ruiz · 2025' },
  src_varga2024: { title: 'Dense-Only Baselines for Multi-hop QA', label: 'Varga & Chen 2024', meta: 'Varga & Chen · 2024' },
  src_ito2025: { title: 'GraphRAG: Community Summaries for Global Questions', label: 'Ito 2025', meta: 'Ito · 2025' },
  src_daly2025: { title: 'Chunking Strategies for Dense Retrieval', label: 'Daly 2025', meta: 'Daly · 2025' },
  src_meyer2024: { title: 'Late Interaction Retrieval at Scale', label: 'Meyer 2024', meta: 'Meyer · 2024' },
};

function citation(messageId, ordinal, key) {
  const p = PASSAGES[key];
  const info = SOURCE_INFO[p.source_id];
  return {
    id: `cit_${messageId.slice(4)}_${ordinal}`,
    message_id: messageId,
    chunk_id: p.chunk_id,
    ordinal,
    source_id: p.source_id,
    source_title: info.title,
    source_label: info.label,
    source_meta: info.meta,
    page: p.page,
    section: p.section,
    passage: p.passage,
    quote: p.quote,
    char_start: p.char_start,
    char_end: p.char_end,
  };
}

const ENT = {
  hybrid: { id: 'ent_m_hybrid', name: 'Hybrid retrieval', entity_type: 'method' },
  bm25: { id: 'ent_m_bm25', name: 'BM25', entity_type: 'method' },
  nq: { id: 'ent_d_nq', name: 'Natural Questions', entity_type: 'dataset' },
  triviaqa: { id: 'ent_d_triviaqa', name: 'TriviaQA', entity_type: 'dataset' },
  hotpotqa: { id: 'ent_d_hotpotqa', name: 'HotpotQA', entity_type: 'dataset' },
  graphrag: { id: 'ent_m_graphrag', name: 'GraphRAG', entity_type: 'method' },
  longchunks: { id: 'ent_c_longchunks', name: 'Long chunks hurt recall', entity_type: 'claim' },
};

function userMessage(id, conversation_id, content, at) {
  return base(id, conversation_id, 'user', content, at);
}

function base(id, conversation_id, role, content, created_at) {
  return {
    id,
    conversation_id,
    role,
    content,
    status: 'complete',
    created_at,
    answer_kind: null,
    sources_used: null,
    sources_searched: null,
    limitations: null,
    positions: null,
    inference: null,
    suggestion: null,
    related_entities: [],
    citations: [],
    proposal_id: null,
    error: null,
    cancelled_at: null,
  };
}

// --- Assistant answers --------------------------------------------------------

export const HYBRID_ANSWER = (id = 'msg_hybrid_a1', conversation_id = 'conv_hybrid', at = t('14:20', 11, 40)) => ({
  ...base(id, conversation_id, 'assistant',
    'Two sources report that hybrid retrieval (BM25 + dense) beats dense-only retrieval:\n\n' +
      '- **Santos & Lee (2025)** — hybrid improves top-20 accuracy on **Natural Questions** by 4.1 points [1]\n' +
      '- **Okafor et al. (2025)** — gains on **Natural Questions** (+3.6) and **TriviaQA** (+2.9), largest on the shifted BEIR subsets [2]\n\n' +
      'One source points the other way for multi-hop questions: on **HotpotQA**, a tuned dense-only retriever matches hybrid within 0.5 points [3].',
    at),
  answer_kind: 'answer',
  sources_used: 3,
  sources_searched: 14,
  limitations: 'only 3 of 14 sources compare hybrid and dense-only directly, and they report different metrics (top-20 accuracy vs. nDCG@10), so the gains are not directly comparable.',
  related_entities: [ENT.hybrid, ENT.bm25, ENT.nq],
  citations: [citation(id, 1, 'santos_p4'), citation(id, 2, 'okafor_p6'), citation(id, 3, 'varga_p9')],
});

export const NO_EVIDENCE_ANSWER = (id = 'msg_graphrag_a2', conversation_id = 'conv_graphrag', at = t('15:02', 9, 20)) => ({
  ...base(id, conversation_id, 'assistant',
    'I couldn’t find a fine-tuning learning rate for GraphRAG in the 14 sources of RAG Comparison, so I’m not going to guess one.',
    at),
  answer_kind: 'no_evidence',
  sources_used: 0,
  sources_searched: 14,
  limitations: 'Closest passage: Ito (2025) describes GraphRAG’s indexing pipeline but does not report training hyperparameters [1]',
  suggestion: 'Tip: the GraphRAG appendix or code repository usually lists training settings.',
  related_entities: [ENT.graphrag],
  citations: [citation(id, 1, 'ito_p5')],
});

export const CONFLICTING_ANSWER = (id = 'msg_evalplan_a2', conversation_id = 'conv_evalplan', at = t('15:10', 9, 30)) => ({
  ...base(id, conversation_id, 'assistant', 'Your sources reach different conclusions, so here are both sides.', at),
  answer_kind: 'conflicting',
  sources_used: 2,
  sources_searched: 14,
  positions: [
    { label: 'Position A', title: 'Longer chunks lower recall', quote: PASSAGES.daly_p7.quote, context: ' on Natural Questions.', citation_ordinal: 1 },
    { label: 'Position B', title: 'No significant effect', quote: PASSAGES.meyer_p11.quote, context: ' for the late-interaction retriever.', citation_ordinal: 2 },
  ],
  inference: 'The studies differ in dataset (Natural Questions vs. BEIR-SciFact), retriever (dense vs. late interaction), and metric (Recall@20 vs. nDCG@10). Both results can hold at once; neither tests your exact setup.',
  related_entities: [ENT.longchunks, ENT.nq],
  citations: [citation(id, 1, 'daly_p7'), citation(id, 2, 'meyer_p11')],
});

export const PROPOSAL_ANSWER = (id, conversation_id, at) => ({
  ...base(id, conversation_id, 'assistant',
    'I prepared a GitHub issue in `lab/rag-experiments` from this finding. Nothing is sent to GitHub until you approve it — review the exact content below or in Approvals.',
    at),
  answer_kind: 'answer',
  sources_used: 2,
  sources_searched: 14,
  related_entities: [ENT.hybrid],
  citations: [citation(id, 1, 'santos_p4'), citation(id, 2, 'okafor_p6')],
  proposal_id: 'prop_01JC9X4M7Q',
});

export const ONBOARDING_ANSWER = (id = 'msg_stream_onboarding', conversation_id = 'conv_new', at = t('15:10')) => ({
  ...base(id, conversation_id, 'assistant',
    'In **Hybrid Retrieval Under Distribution Shift**, combining BM25 with the dense retriever improves top-20 accuracy over dense-only on both datasets the paper tests:\n\n' +
      '- **Natural Questions** — +3.6 points [1]\n' +
      '- **TriviaQA** — +2.9 points [1]\n\n' +
      'The largest gains are on the shifted **BEIR** subsets, which the authors use to test distribution shift [2].',
    at),
  answer_kind: 'answer',
  sources_used: 1,
  sources_searched: 1,
  limitations: 'this answer comes from one paper. Add more sources to compare its results with other studies.',
  related_entities: [ENT.hybrid, ENT.nq, ENT.triviaqa],
  citations: [citation(id, 1, 'okafor_p6'), citation(id, 2, 'okafor_p5')],
});

function simpleAnswer(id, conversation_id, at, content, cites, entities) {
  return {
    ...base(id, conversation_id, 'assistant', content, at),
    answer_kind: 'answer',
    sources_used: new Set(cites.map((k) => PASSAGES[k].source_id)).size,
    sources_searched: 14,
    related_entities: entities,
    citations: cites.map((k, i) => citation(id, i + 1, k)),
  };
}

// --- Conversations ------------------------------------------------------------------

const RAG = { project_id: 'prj_rag', project_name: 'RAG Comparison' };
const THESIS = { project_id: 'prj_thesis', project_name: 'Thesis Proposal' };

function conv(id, title, project, created_at, last_message_at) {
  return { id, workspace_id: 'ws_personal', ...project, user_id: 'usr_josua', title, created_at, last_message_at };
}

export const CONVERSATIONS = [
  conv('conv_hybrid', 'Hybrid vs dense-only results', RAG, t('14:20'), t('14:20', 11, 40)),
  conv('conv_datasets', 'Datasets used across papers', RAG, t('11:05'), t('11:05', 11, 30)),
  conv('conv_graphrag', 'GraphRAG community summaries', RAG, t('14:40', 9), t('15:02', 9, 20)),
  conv('conv_evalplan', 'Eval plan for chunk sizes', RAG, t('10:30', 9), t('15:10', 9, 30)),
  conv('conv_thesisoutline', 'Thesis proposal outline', THESIS, t('19:50', 8), t('19:52', 8)),
  conv('conv_readinglist', 'Reading list for retrieval eval', THESIS, t('16:00', 2), t('16:03', 2)),
];

const MESSAGES = {
  conv_hybrid: [
    userMessage('msg_hybrid_u1', 'conv_hybrid', 'Which papers report that hybrid retrieval beats dense-only, and on which datasets?', t('14:20')),
    HYBRID_ANSWER(),
  ],
  conv_datasets: [
    userMessage('msg_datasets_u1', 'conv_datasets', 'Which datasets do my RAG papers share?', t('11:05')),
    simpleAnswer('msg_datasets_a1', 'conv_datasets', t('11:05', 11, 30),
      'Three datasets appear in more than one paper:\n\n- **Natural Questions** — Santos & Lee (2025) and Okafor et al. (2025) [1] [2]\n- **TriviaQA** — Okafor et al. (2025) [2]\n- **HotpotQA** — Varga & Chen (2024) use it to test multi-hop retrieval [3]',
      ['santos_p4', 'okafor_p5', 'varga_p9'], [ENT.nq, ENT.triviaqa, ENT.hotpotqa]),
  ],
  conv_graphrag: [
    userMessage('msg_graphrag_u1', 'conv_graphrag', 'How does GraphRAG build its community summaries?', t('14:40', 9)),
    simpleAnswer('msg_graphrag_a1', 'conv_graphrag', t('14:40', 9, 25),
      'GraphRAG extracts entities and relations from each text unit, groups them into communities with the Leiden algorithm, and writes a summary for every community ahead of time [1].',
      ['ito_p5'], [ENT.graphrag]),
    userMessage('msg_graphrag_u2', 'conv_graphrag', 'What learning rate did the GraphRAG paper use for fine-tuning?', t('15:02', 9)),
    NO_EVIDENCE_ANSWER(),
  ],
  conv_evalplan: [
    userMessage('msg_evalplan_u1', 'conv_evalplan', 'What chunk size did Daly use as the default?', t('10:30', 9)),
    simpleAnswer('msg_evalplan_a1', 'conv_evalplan', t('10:30', 9, 20),
      'Daly (2025) reports the best Recall@20 with 384-token chunks, and a 64-token overlap adds about one point at every length [1].',
      ['daly_p7'], [ENT.longchunks]),
    userMessage('msg_evalplan_u2', 'conv_evalplan', 'Does a chunk size above 512 tokens hurt retrieval quality?', t('15:10', 9)),
    CONFLICTING_ANSWER(),
  ],
  conv_thesisoutline: [
    userMessage('msg_thesis_u1', 'conv_thesisoutline', 'Which finding should anchor the motivation chapter?', t('19:50', 8)),
    simpleAnswer('msg_thesis_a1', 'conv_thesisoutline', t('19:52', 8),
      'The clearest motivating result is that lexical matching helps most for rare entity names, which dense encoders under-represent [1]. It connects directly to the graph-aware retrieval question.',
      ['okafor_p10'], [ENT.hybrid]),
  ],
  conv_readinglist: [
    userMessage('msg_reading_u1', 'conv_readinglist', 'Which two papers should I read first for the retrieval evaluation?', t('16:00', 2)),
    simpleAnswer('msg_reading_a1', 'conv_readinglist', t('16:03', 2),
      'Start with Santos & Lee (2025) for the fusion baseline [1], then Varga & Chen (2024) for the multi-hop counterpoint [2].',
      ['santos_p4', 'varga_p9'], [ENT.hybrid, ENT.hotpotqa]),
  ],
};

const SCOPES = {
  prj_rag: { project_id: 'prj_rag', label: 'Project RAG Comparison', source_count: 14 },
  prj_thesis: { project_id: 'prj_thesis', label: 'Project Thesis Proposal', source_count: 6 },
};

// --- Streams --------------------------------------------------------------------------

function tokens(text) {
  const words = text.split(/(\s+)/);
  const out = [];
  for (let i = 0; i < words.length; i += 6) out.push(words.slice(i, i + 6).join(''));
  return out;
}

function retrieving(passages, sources, chips, stepState) {
  return {
    event: 'status',
    data: {
      phase: 'retrieving',
      steps: [
        { label: 'Scope resolved — Project RAG Comparison · 14 sources', state: 'done' },
        { label: 'Searching keyword + vector index, expanding 1 graph hop', state: stepState },
        { label: 'Generating answer from the evidence packet', state: 'pending' },
      ],
      passages_found: passages,
      sources_found: sources,
      sources: chips,
    },
  };
}

const CHIPS = [
  { label: 'Okafor et al. 2025', passages: 4 },
  { label: 'Santos & Lee 2025', passages: 3 },
  { label: 'Varga & Chen 2024', passages: 2 },
  { label: 'Daly 2025', passages: 2 },
  { label: 'Kowalski 2024', passages: 1 },
];

function recorded(message, { passages = 12, sources = 5, chips = CHIPS, error: err } = {}) {
  const events = [
    { delay_ms: 300, ...retrieving(3, 2, chips.slice(0, 2), 'active') },
    { delay_ms: 700, ...retrieving(passages, sources, chips, 'active') },
    { delay_ms: 900, ...retrieving(passages, sources, chips, 'done') },
    {
      delay_ms: 300,
      event: 'status',
      data: { ...retrieving(passages, sources, chips, 'done').data, phase: 'generating', steps: retrieving(passages, sources, chips, 'done').data.steps.map((s, i) => (i === 2 ? { ...s, state: 'active' } : s)) },
    },
  ];
  if (err) {
    events.push({ delay_ms: 2500, event: 'error', data: err });
    return { message_id: message.id, events };
  }
  for (const token of tokens(message.content)) events.push({ delay_ms: 60, event: 'token', data: { text: token } });
  for (const c of message.citations) events.push({ delay_ms: 40, event: 'citation', data: c });
  events.push({ delay_ms: 100, event: 'done', data: { message } });
  return { message_id: message.id, events };
}

export function generateConversations() {
  write('conversations/list.200.json', { items: CONVERSATIONS, next_cursor: null, total: CONVERSATIONS.length });
  write('conversations/detail.200.json', {
    _note: 'GET /api/v1/conversations/{id} keyed by id.',
    items: Object.fromEntries(CONVERSATIONS.map((c) => [c.id, { ...c, messages: MESSAGES[c.id], scope: SCOPES[c.project_id] }])),
  });
  write('conversations/create.201.json', {
    id: 'conv_new',
    workspace_id: 'ws_personal',
    project_id: 'prj_rag',
    project_name: 'RAG Comparison',
    user_id: 'usr_josua',
    title: 'New conversation',
    created_at: t('15:10'),
    last_message_at: t('15:10'),
    messages: [],
    scope: SCOPES.prj_rag,
  });
  write('conversations/send-message.202.json', {
    user_message: userMessage('msg_new_u1', 'conv_hybrid', 'Create a GitHub issue in lab/rag-experiments to re-run our eval with hybrid retrieval, based on this finding.', t('14:33')),
    message_id: 'msg_new_a1',
  });
  write('conversations/send-message.404.json', error('NOT_FOUND', 'Conversation not found.', 'req_aa01bb02'));
  write('conversations/cancel.200.json', { message_id: 'msg_new_a1', status: 'cancelled' });
  write('messages/feedback.201.json', { id: 'fb_01JCA3', message_id: 'msg_hybrid_a1', kind: 'incorrect', created_at: t('15:10') });

  write('streams/answer.hybrid.sse.json', recorded(HYBRID_ANSWER('msg_stream_answer', 'conv_hybrid', t('15:10'))));
  write('streams/answer.onboarding.sse.json', recorded(ONBOARDING_ANSWER(), { passages: 4, sources: 1, chips: [{ label: 'Okafor et al. 2025', passages: 4 }] }));
  write('streams/no-evidence.sse.json', recorded(NO_EVIDENCE_ANSWER('msg_stream_noevidence', 'conv_graphrag', t('15:10')), { passages: 2, sources: 1, chips: [{ label: 'Ito 2025', passages: 2 }] }));
  write('streams/conflicting.sse.json', recorded(CONFLICTING_ANSWER('msg_stream_conflict', 'conv_evalplan', t('15:10')), { passages: 6, sources: 2, chips: [{ label: 'Daly 2025', passages: 4 }, { label: 'Meyer 2024', passages: 2 }] }));
  write('streams/proposal.create-issue.sse.json', recorded(PROPOSAL_ANSWER('msg_stream_proposal', 'conv_hybrid', t('15:10')), { passages: 5, sources: 2, chips: CHIPS.slice(0, 2) }));
  write('streams/error.model-timeout.sse.json', recorded(HYBRID_ANSWER('msg_stream_error', 'conv_hybrid', t('15:10')), {
    error: { code: 'MODEL_TIMEOUT', message: 'The model didn’t respond in time', details: { passages_retrieved: 12, memory_written: false }, request_id: 'req_7d2e9f10', retryable: true },
  }));
}
