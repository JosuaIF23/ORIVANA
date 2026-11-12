// Audit events: 50 in the last 7 days (46 from v1 + 4 v2 events), matching the Activity filter counts.
import { t, tOct, write } from './lib.mjs';
import { SOURCES } from './sources.mjs';

let seq = 0;
function evt(id, at, actor_type, category, event_type, summary, link, result, extra = {}) {
  seq += 1;
  return {
    id,
    workspace_id: 'ws_personal',
    actor_type,
    actor_id: actor_type === 'user' ? 'usr_josua' : actor_type === 'agent' ? 'agent_orivana' : 'system',
    event_type,
    category,
    target_type: link?.target_type ?? 'workspace',
    target_id: link?.target_id ?? 'ws_personal',
    summary,
    link,
    result,
    request_id: `req_${(0x5b91e2c4 + seq * 7919).toString(16).slice(-8)}`,
    created_at: at,
    metadata: {},
    ...extra,
  };
}

const repo = { label: 'lab/rag-experiments', target_type: 'repository', target_id: 'lab/rag-experiments' };
const convHybrid = { label: 'Hybrid vs dense-only results', target_type: 'conversation', target_id: 'conv_hybrid' };
const srcLink = (id, label) => ({ label, target_type: 'source', target_id: id });

const alertLink = { label: 'D-04 Use hybrid retrieval for thesis experiments', target_type: 'decision_alert', target_id: 'alert_01JCD04VRG' };

// v2 events for the flagship story (Zotero sync → extraction → decision alert).
const V2 = [
  evt('evt_8a01', t('09:00'), 'system', 'zotero_sync', 'zotero.sync_completed', 'Synced Zotero collection {link}: no changes, 1 item removed in Zotero', { label: 'RAG Comparison', target_type: 'zotero_collection', target_id: 'ZC7K2RAG' }, 'succeeded'),
  evt('evt_8a02', t('16:44', 10), 'system', 'extraction', 'extraction.completed', 'Extracted 6 entities and 5 relationships from {link}; 1 contradicts a claim', srcLink('src_varga2024', 'Dense-Only Baselines for Multi-hop QA'), 'candidate'),
  evt('evt_8a03', t('16:45', 10), 'system', 'decision_alerts', 'decision_alert.raised', 'Decision {link} needs review: new evidence contradicts a claim it depends on', alertLink, 'needs_review', {
    metadata: { secondary: { label: 'Hybrid retrieval outperforms dense-only retrieval on open-domain QA', target_type: 'claim', target_id: 'ent_c_hybridbeats' } },
  }),
  evt('evt_8a04', t('16:45', 10), 'agent', 'proposals', 'decision_alert.assessed', 'Assessed the impact on {link}: weakens (confidence 0.78)', alertLink, 'succeeded'),
];

const VISIBLE = [
  evt('evt_7f3a01', t('14:34'), 'agent', 'proposals', 'action_proposal.created', 'Proposed creating an issue in {link}', repo, 'awaiting_approval'),
  evt('evt_7f3a02', t('14:22'), 'agent', 'memory', 'memory.suggested', 'Suggested 2 memories from {link}', convHybrid, 'candidate'),
  evt('evt_7f3a03', t('14:20'), 'system', 'retrieval', 'retrieval.completed', 'Retrieved 12 passages from 5 sources; 3 cited in {link}', convHybrid, 'succeeded'),
  evt('evt_7f3a04', t('14:05'), 'agent', 'tool_calls', 'tool.github.list_issues', 'Read 23 open issues (github.list_issues) in {link}', repo, 'succeeded'),
  evt('evt_7f3a05', t('13:58'), 'system', 'ingestion', 'ingestion.indexing_started', 'Started indexing {link}', srcLink('src_daly2025', 'Chunking Strategies for Dense Retrieval'), 'in_progress'),
  evt('evt_7f3a06', t('11:12'), 'system', 'errors', 'ingestion.failed', 'Parsing failed for {link}', srcLink('src_survey2019', 'survey-scan-2019.pdf'), 'failed', {
    metadata: {
      error_code: 'PDF_ENCRYPTED',
      error_message: 'The PDF is password-protected, so text and page numbers can’t be extracted.',
      job: 'job_01JC8ZP3 · parse · attempt 2 of 3',
      related: { label: 'Source · survey-scan-2019.pdf', target_type: 'source', target_id: 'src_survey2019', project_name: 'Thesis Proposal' },
    },
    request_id: 'req_5b91e2c4',
  }),
  evt('evt_7f3a07', t('09:40'), 'user', 'approvals', 'action_proposal.rejected', 'Rejected proposal “Update README eval table” for {link}', repo, 'rejected'),
  evt('evt_7f3a08', t('17:02', 10), 'user', 'memory', 'memory.confirmed', 'Confirmed memory {link}', { label: 'Default chunking: 384 tokens', target_type: 'memory', target_id: 'mem_chunking_384' }, 'confirmed'),
  evt('evt_7f3a09', t('16:40', 10), 'system', 'zotero_sync', 'zotero.sync_completed', 'Synced 1 new item from Zotero collection “RAG Comparison”: {link}', srcLink('src_varga2024', 'Dense-Only Baselines for Multi-hop QA'), 'succeeded'),
  evt('evt_7f3a10', t('16:10', 10), 'system', 'external_actions', 'external_action.succeeded', 'Created and verified issue {link}', { label: 'lab/rag-experiments#41', target_type: 'issue', target_id: 'lab/rag-experiments#41' }, 'verified'),
];

function older() {
  const out = [];
  // Ingestion: 12 more uploads (ready sources, excluding ones already shown).
  // Re-index after the embedding model update (5–10 Nov), so all 46 events fall in the last 7 days.
  const uploads = SOURCES.filter((s) => s.status === 'ready' && s.id !== 'src_varga2024').slice(0, 12);
  uploads.forEach((s, i) =>
    out.push(evt(`evt_6a${String(i).padStart(2, '0')}`, t(`${String(9 + (i % 6)).padStart(2, '0')}:${String(10 + i).padStart(2, '0')}`, 5 + (i % 5)), 'system', 'ingestion', 'ingestion.reindexed', 'Re-indexed {link} with the updated embedding model', srcLink(s.id, s.title), 'ready')),
  );
  // Retrieval: 10.
  const convs = [
    ['conv_datasets', 'Datasets used across papers', t('11:05'), 9, 3],
    ['conv_evalplan', 'Eval plan for chunk sizes', t('15:10', 9), 6, 2],
    ['conv_graphrag', 'GraphRAG community summaries', t('15:02', 9), 2, 0],
    ['conv_graphrag', 'GraphRAG community summaries', t('14:40', 9), 5, 1],
    ['conv_evalplan', 'Eval plan for chunk sizes', t('10:30', 9), 4, 1],
    ['conv_thesisoutline', 'Thesis proposal outline', t('19:50', 8), 7, 1],
    ['conv_thesisoutline', 'Thesis proposal outline', t('19:40', 8), 8, 2],
    ['conv_hybrid', 'Hybrid vs dense-only results', t('14:33'), 5, 2],
    ['conv_datasets', 'Datasets used across papers', t('10:58'), 10, 3],
    ['conv_evalplan', 'Eval plan for chunk sizes', t('10:20', 9), 6, 2],
  ];
  convs.forEach(([id, label, at, p, c], i) =>
    out.push(evt(`evt_6b${i}`, at, 'system', 'retrieval', 'retrieval.completed', `Retrieved ${p} passages; ${c} cited in {link}`, { label, target_type: 'conversation', target_id: id }, 'succeeded')),
  );
  // Memory: 4.
  out.push(evt('evt_6c0', t('14:46', 9), 'user', 'memory', 'memory.rejected', 'Rejected memory {link}', { label: 'Dense retrieval always outperforms BM25.', target_type: 'memory', target_id: 'mem_dense_always' }, 'rejected'));
  out.push(evt('evt_6c1', t('10:42', 9), 'agent', 'memory', 'memory.suggested', 'Suggested 1 memory from {link}', { label: 'Eval plan for chunk sizes', target_type: 'conversation', target_id: 'conv_evalplan' }, 'candidate'));
  out.push(evt('evt_6c2', t('10:00', 6), 'user', 'memory', 'memory.superseded', 'Marked {link} superseded by D-04', { label: 'D-02 Dense-only default', target_type: 'memory', target_id: 'dec_rag_02' }, 'confirmed'));
  out.push(evt('evt_6c3', t('14:30', 5), 'user', 'memory', 'memory.created', 'Added memory {link}', { label: 'Supervisor meeting: focus the thesis on graph-aware retrieval', target_type: 'memory', target_id: 'mem_supervisor_q1' }, 'confirmed'));
  // Tool calls: 4.
  out.push(evt('evt_6d0', t('16:05', 10), 'agent', 'tool_calls', 'tool.github.get_issue', 'Verified issue {link} (github.get_issue)', { label: 'lab/rag-experiments#41', target_type: 'issue', target_id: 'lab/rag-experiments#41' }, 'succeeded'));
  out.push(evt('evt_6d1', t('11:15', 9), 'agent', 'tool_calls', 'tool.github.list_labels', 'Read labels (github.list_labels) in {link}', repo, 'succeeded'));
  out.push(evt('evt_6d2', t('11:10', 9), 'agent', 'tool_calls', 'tool.github.list_issues', 'Read 21 open issues (github.list_issues) in {link}', repo, 'succeeded'));
  out.push(evt('evt_6d3', t('10:01', 6), 'agent', 'tool_calls', 'tool.github.list_issues', 'Read 19 open issues (github.list_issues) in {link}', repo, 'succeeded'));
  // Approvals: 2.
  out.push(evt('evt_6e0', t('16:09', 10), 'user', 'approvals', 'action_proposal.approved', 'Approved proposal “Log chunk-size results” for {link}', repo, 'succeeded'));
  out.push(evt('evt_6e1', t('11:19', 9), 'user', 'approvals', 'action_proposal.approved', 'Approved proposal “Fix random seed in eval script” for {link}', repo, 'succeeded'));
  // External actions: 2.
  out.push(evt('evt_6f0', t('11:20', 9), 'system', 'external_actions', 'external_action.succeeded', 'Created and verified issue {link}', { label: 'lab/rag-experiments#40', target_type: 'issue', target_id: 'lab/rag-experiments#40' }, 'verified'));
  out.push(evt('evt_6f1', t('10:05', 6), 'system', 'external_actions', 'external_action.succeeded', 'Created and verified issue {link}', { label: 'lab/rag-experiments#38', target_type: 'issue', target_id: 'lab/rag-experiments#38' }, 'verified'));
  // Errors: 2.
  out.push(evt('evt_6g0', t('11:12', 9), 'system', 'errors', 'tool.rate_limited', 'GitHub rate limit while reading {link}; retried after 30 s', repo, 'failed', {
    metadata: { error_code: 'RATE_LIMITED', error_message: 'GitHub returned 403 secondary rate limit. The call was retried once and succeeded.', job: 'tool_call · github.list_issues · attempt 1 of 2' },
  }));
  out.push(evt('evt_6g1', t('16:42', 10), 'system', 'errors', 'ingestion.extraction_timeout', 'Entity extraction timed out for {link}', srcLink('src_varga2024', 'Dense-Only Baselines for Multi-hop QA'), 'failed', {
    metadata: { error_code: 'MODEL_TIMEOUT', error_message: 'The model gateway did not respond within 60 s. Attempt 2 succeeded at 16:44.', job: 'job_varga202 · extract · attempt 1 of 3' },
  }));
  return out;
}

export function generateAudit() {
  const all = [...V2, ...VISIBLE, ...older()].sort((a, b) => b.created_at.localeCompare(a.created_at));
  const counts = { ingestion: 0, zotero_sync: 0, retrieval: 0, extraction: 0, memory: 0, decision_alerts: 0, proposals: 0, tool_calls: 0, approvals: 0, external_actions: 0, errors: 0 };
  for (const e of all) counts[e.category] += 1;
  write('audit-events/list.200.json', {
    _note: 'Mock store seed: all events in the last 7 days. The real API returns 10 per page with next_cursor.',
    items: all,
    next_cursor: null,
    total: all.length,
    counts,
  });
  write('audit-events/export.csv.200.json', {
    _note: 'GET /api/v1/audit-events/export returns text/csv; this fixture shows the header and first row.',
    content_type: 'text/csv',
    body: 'id,created_at,actor_type,category,event_type,target_type,target_id,result,request_id\nevt_7f3a01,2026-11-11T07:34:00Z,agent,approvals,action_proposal.created,repository,lab/rag-experiments,awaiting_approval,req_…\n',
  });
  return counts;
}

export { tOct };
