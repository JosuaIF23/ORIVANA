// Action proposals: 2 pending + 14 decided, plus approve/edit/reject/run fixtures.
import { t, tOct, write, error } from './lib.mjs';

const TARGET = { provider: 'github', account: '@jsilalahi', repository: 'lab/rag-experiments', visibility: 'public' };
const PERMISSION = { label: 'Issues: read & write', granted_at: t('09:00', 2) };

const RERUN_BODY = [
  '## Finding',
  'Two papers report that hybrid retrieval beats dense-only:',
  '- Santos & Lee 2025 — +4.1 top-20 accuracy on NQ (p. 4)',
  '- Okafor et al. 2025 — +3.6 on NQ, +2.9 on TriviaQA (p. 6)',
  '',
  '## Task',
  '- [ ] Add a BM25 + dense retriever config (RRF, k = 60)',
  '- [ ] Re-run the eval on the NQ and TriviaQA splits',
  '- [ ] Report top-20 accuracy and nDCG@10',
].join('\n');

function proposal(id, fields) {
  return {
    id,
    task_id: `task_${id.slice(5, 11)}`,
    connection_id: 'conn_github',
    tool: 'github.create_issue',
    risk_level: 'low_write',
    idempotency_key: id,
    revision: 1,
    project_id: 'prj_rag',
    project_name: 'RAG Comparison',
    conversation_id: null,
    conversation_title: null,
    proposed_by: 'agent',
    decided_by: null,
    decided_at: null,
    reject_reason: null,
    target: TARGET,
    action_label: 'Create 1 issue',
    required_permission: PERMISSION,
    citations: [],
    side_effects: [
      { kind: 'creates', text: 'Creates 1 public issue in lab/rag-experiments.' },
      { kind: 'notifies', text: 'GitHub may notify people watching the repository.' },
      { kind: 'unchanged', text: 'Nothing else changes: no comments, no new labels, no other repositories.' },
    ],
    validation: { status: 'passed', issues: [] },
    changes_since_proposal: [],
    latest_run: null,
    audit_event_id: null,
    origin: fields.conversation_id
      ? { type: 'assistant', id: fields.conversation_id, label: `From conversation: ${fields.conversation_title}` }
      : { type: 'assistant', id: null, label: 'From the Assistant' },
    linked_decision: null,
    ...fields,
  };
}

export const RERUN = proposal('prop_01JC9X4M7Q', {
  title: 'Create issue: Re-run eval with hybrid retrieval',
  status: 'awaiting_approval',
  conversation_id: 'conv_hybrid',
  conversation_title: 'Hybrid vs dense-only results',
  created_at: t('14:34'),
  expires_at: t('14:34', 18),
  original_request: { text: 'Create a GitHub issue in lab/rag-experiments to re-run our eval with hybrid retrieval, based on this finding.', at: t('14:33') },
  arguments: {
    repository: 'lab/rag-experiments',
    title: 'Re-run eval with hybrid retrieval (BM25 + dense)',
    body: RERUN_BODY,
    labels: ['evaluation', 'retrieval'],
    assignees: [],
  },
  citations: [
    { ordinal: 1, source_id: 'src_santos2025', source_title: 'Fusion Retrieval Revisited: BM25 + Dense on Open-Domain QA', page: 4, section: '3.1' },
    { ordinal: 2, source_id: 'src_okafor2025', source_title: 'Hybrid Retrieval Under Distribution Shift', page: 6, section: '4.2' },
  ],
});

export const HOTPOTQA = proposal('prop_01JC8R2D1H', {
  title: 'Create issue: Add HotpotQA multi-hop split to eval',
  status: 'awaiting_approval',
  conversation_id: 'conv_evalplan',
  conversation_title: 'Eval plan for chunk sizes',
  created_at: t('13:10'),
  expires_at: t('13:10', 18),
  original_request: { text: 'Draft an issue to add the HotpotQA multi-hop split to our eval set.', at: t('13:09') },
  arguments: {
    repository: 'lab/rag-experiments',
    title: 'Add HotpotQA multi-hop split to the evaluation set',
    body: '## Why\nVarga & Chen (2024) find the hybrid advantage disappears on multi-hop questions (p. 9). Our evaluation set has no multi-hop questions.\n\n## Task\n- [ ] Add 200 HotpotQA distractor-setting questions\n- [ ] Re-run dense-only and hybrid on the new split',
    labels: ['evaluation'],
    assignees: [],
  },
  citations: [{ ordinal: 1, source_id: 'src_varga2024', source_title: 'Dense-Only Baselines for Multi-hop QA', page: 9, section: '5' }],
});

// v2: created by "Propose action" on the D-04 Decision Impact alert (UI.md §13).
const ALERT_BODY = [
  '## Why',
  'ORIVANA flagged decision **D-04 · Use hybrid retrieval for thesis experiments** for review.',
  'It depends on the claim "Hybrid retrieval outperforms dense-only retrieval on open-domain QA".',
  '',
  '- New: Varga & Chen 2024 — no gain over a tuned dense retriever on HotpotQA (p. 9, §5)',
  '- Supports: Santos & Lee 2025 — +4.1 top-20 on NQ (p. 4)',
  '- Supports: Okafor et al. 2025 — +3.6 NQ, +2.9 TriviaQA (p. 6)',
  '',
  '## Task',
  '- [ ] Run hybrid and dense-only on the HotpotQA multi-hop split',
  '- [ ] Compare top-20 accuracy and nDCG@10 per question type',
  '- [ ] Update D-04 in ORIVANA with the result',
  '',
  'Decision: ORIVANA · RAG Comparison · D-04',
].join('\n');

export const ALERT_PROPOSAL = proposal('prop_01JCD04ALT', {
  title: 'Create issue: Re-evaluate retrieval choice for multi-hop questions',
  status: 'awaiting_approval',
  proposed_by: 'agent',
  created_at: t('15:10'),
  expires_at: t('15:10', 18),
  original_request: { text: 'Decision Impact alert: Varga & Chen 2024 (p. 9) contradicts a claim that D-04 depends on.', at: t('15:10') },
  arguments: {
    repository: 'lab/rag-experiments',
    title: 'Re-evaluate retrieval choice for multi-hop questions',
    body: ALERT_BODY,
    labels: ['evaluation', 'retrieval'],
    assignees: [],
  },
  citations: [
    { ordinal: 1, source_id: 'src_varga2024', source_title: 'Dense-Only Baselines for Multi-hop QA', page: 9, section: '5' },
    { ordinal: 2, source_id: 'src_santos2025', source_title: 'Fusion Retrieval Revisited: BM25 + Dense on Open-Domain QA', page: 4, section: '3.1' },
    { ordinal: 3, source_id: 'src_okafor2025', source_title: 'Hybrid Retrieval Under Distribution Shift', page: 6, section: '4.2' },
  ],
  origin: { type: 'decision_alert', id: 'alert_01JCD04VRG', label: 'From Decision Impact alert: Use hybrid retrieval for thesis experiments' },
  linked_decision: { id: 'dec_rag_04', code: 'D-04', title: 'Use hybrid retrieval for thesis experiments' },
});

// Decided history (14).
const DECIDED_ROWS = [
  ['prop_01JC7Q0README', 'Create issue: Update README eval table', 'rejected', t('09:40'), 'The README table is generated by CI; no manual issue needed.'],
  ['prop_01JC6P9LOG41', 'Create issue: Log chunk-size results', 'succeeded', t('16:10', 10), null, 41],
  ['prop_01JC5N8SEED', 'Create issue: Fix random seed in eval script', 'succeeded', t('11:20', 9), null, 40],
  ['prop_01JC4M7BM25', 'Create issue: Tune BM25 k1 and b', 'rejected', t('17:45', 8), 'Out of scope for this milestone.'],
  ['prop_01JC3L6NDCG', 'Create issue: Add nDCG@10 to the report', 'succeeded', t('10:05', 6), null, 38],
  ['prop_01JC2K5DUP', 'Create issue: Re-index Okafor et al. 2025', 'expired', t('09:00', 5), null],
  ['prop_01JC1J4RRF', 'Create issue: Compare RRF k = 20 / 60', 'succeeded', t('15:30', 4), null, 36],
  ['prop_01JC0H3OVL', 'Create issue: Test 64-token overlap', 'succeeded', t('13:15', 3), null, 35],
  ['prop_01JBZG2SCI', 'Create issue: Add SciFact subset', 'rejected', t('16:40', 2), 'We use BEIR averages only.'],
  ['prop_01JBYF1LAT', 'Create issue: Log query latency', 'succeeded', t('10:30', 1), null, 33],
  ['prop_01JBXE0GPU', 'Create issue: Reserve GPU for re-index', 'rejected', tOct('18:00', 31), 'Handled outside GitHub.'],
  ['prop_01JBWD9CFG', 'Create issue: Split retriever configs', 'succeeded', tOct('11:10', 30), null, 31],
  ['prop_01JBVC8DOC', 'Create issue: Document eval protocol', 'succeeded', tOct('14:50', 29), null, 30],
  ['prop_01JBUB7BASE', 'Create issue: Add dense-only baseline', 'succeeded', tOct('09:40', 28), null, 29],
];

function run(id, proposalId, attempt, status, at, issue) {
  const done = status === 'succeeded';
  return {
    id,
    proposal_id: proposalId,
    attempt,
    status,
    external_ref: issue ? `lab/rag-experiments#${issue}` : null,
    external_url: issue ? `https://github.com/lab/rag-experiments/issues/${issue}` : null,
    error_message: null,
    started_at: at,
    executed_at: done ? at : null,
    verified_at: done ? at : null,
    steps: [],
    verification: [],
    audit_event_id: null,
  };
}

export const DECIDED = DECIDED_ROWS.map(([id, title, status, at, reason, issue]) =>
  proposal(id, {
    title,
    status,
    created_at: at,
    expires_at: at,
    decided_by: status === 'expired' ? null : 'usr_josua',
    decided_at: at,
    reject_reason: reason ?? null,
    original_request: { text: title.replace('Create issue: ', 'Create an issue to ').toLowerCase(), at },
    origin: { type: 'manual', id: null, label: 'Created by you' },
    arguments: { repository: 'lab/rag-experiments', title: title.replace('Create issue: ', ''), body: '', labels: ['evaluation'], assignees: [] },
    latest_run: status === 'succeeded' ? run(`run_${id.slice(5, 13)}`, id, 1, 'succeeded', at, issue) : null,
  }),
);

const EXECUTING_RUN = {
  id: 'run_01JCA4EX',
  proposal_id: RERUN.id,
  attempt: 1,
  status: 'executing',
  external_ref: null,
  external_url: null,
  error_message: null,
  started_at: t('14:41', 11, 3),
  executed_at: null,
  verified_at: null,
  steps: [
    { label: 'Validated against scope and policy', state: 'done', at: t('14:34') },
    { label: 'Approved by you', state: 'done', at: t('14:41', 11, 2) },
    { label: 'Executing — attempt 1', state: 'active', at: t('14:41', 11, 3) },
    { label: 'Verifying the issue on GitHub', state: 'pending', at: null },
    { label: 'Recorded in audit log', state: 'pending', at: null },
  ],
  verification: [],
  audit_event_id: null,
};

const SUCCEEDED_RUN = {
  ...EXECUTING_RUN,
  status: 'succeeded',
  external_ref: 'lab/rag-experiments#42',
  external_url: 'https://github.com/lab/rag-experiments/issues/42',
  executed_at: t('14:41', 11, 4),
  verified_at: t('14:41', 11, 6),
  steps: EXECUTING_RUN.steps.map((s, i) => ({ ...s, state: 'done', at: s.at ?? [null, null, null, t('14:41', 11, 6), t('14:41', 11, 6)][i] })),
  verification: [
    { label: 'Issue exists', passed: true, detail: 'lab/rag-experiments#42' },
    { label: 'Title and body match the approved content', passed: true, detail: null },
    { label: 'Labels match: evaluation, retrieval', passed: true, detail: null },
    { label: 'No duplicate found for idempotency key', passed: true, detail: 'prop_01JC9X4M7Q' },
  ],
  audit_event_id: 'evt_7f3a91',
};

export function generateActions() {
  write('action-proposals/list.pending.200.json', { items: [RERUN, HOTPOTQA], next_cursor: null, total: 2, counts: { pending: 2, decided: DECIDED.length } });
  write('action-proposals/list.decided.200.json', { items: DECIDED, next_cursor: null, total: DECIDED.length, counts: { pending: 2, decided: DECIDED.length } });
  write('action-proposals/get.prop_01JC9X4M7Q.200.json', RERUN);
  write('action-proposals/create.201.json', RERUN);
  write('action-proposals/get.prop_01JCD04ALT.200.json', ALERT_PROPOSAL);
  const editedArgs = {
    ...RERUN.arguments,
    title: 'Re-run eval with hybrid retrieval (BM25 + dense) and add HotpotQA split',
    body: RERUN_BODY.replace('(p. 6)', '(p. 6)\nOne paper finds no gain on HotpotQA (Varga & Chen 2024, p. 9).').replace('the NQ and TriviaQA splits', 'NQ, TriviaQA, and the HotpotQA split'),
    labels: ['evaluation', 'retrieval', 'needs-triage'],
  };
  write('action-proposals/patch.draft-invalid.200.json', {
    ...RERUN,
    status: 'draft',
    revision: 2,
    arguments: editedArgs,
    validation: { status: 'failed', issues: [{ field: 'labels', message: '“needs-triage” doesn’t exist in lab/rag-experiments. ORIVANA won’t create labels, so validation will ask you to remove it.' }] },
    changes_since_proposal: ['title', 'task list', '1 label added'],
  });
  write('action-proposals/patch.revalidated.200.json', {
    ...RERUN,
    status: 'awaiting_approval',
    revision: 3,
    arguments: { ...editedArgs, labels: ['evaluation', 'retrieval'] },
    validation: { status: 'passed', issues: [] },
    changes_since_proposal: ['title', 'task list'],
  });
  write('action-proposals/patch.409-revision.json', error('CONFLICT', 'This proposal changed since you opened it. Reload to see the latest version.', 'req_0b1c2d3e', { revision: 3 }));
  write('action-proposals/approve.200.json', { proposal: { ...RERUN, status: 'executing', decided_by: 'usr_josua', decided_at: t('14:41', 11, 2), latest_run: EXECUTING_RUN }, run: EXECUTING_RUN });
  write('action-proposals/approve.422-not-validated.json', error('VALIDATION_FAILED', 'Approve unlocks after validation passes.', 'req_4c5d6e7f', { status: 'draft' }));
  write('action-proposals/get.succeeded.200.json', { ...RERUN, status: 'succeeded', decided_by: 'usr_josua', decided_at: t('14:41', 11, 2), latest_run: SUCCEEDED_RUN, audit_event_id: 'evt_7f3a91' });
  write('action-proposals/get.failed.200.json', {
    ...RERUN,
    status: 'failed',
    decided_by: 'usr_josua',
    decided_at: t('14:41', 11, 2),
    latest_run: { ...EXECUTING_RUN, status: 'failed', error_message: 'GitHub returned 502 Bad Gateway. No issue was created; retry uses the same idempotency key.', steps: EXECUTING_RUN.steps.map((s, i) => (i === 2 ? { ...s, state: 'failed' } : s)) },
  });
  write('action-proposals/reject.200.json', {
    ...RERUN,
    status: 'rejected',
    decided_by: 'usr_josua',
    decided_at: t('14:43'),
    reject_reason: 'Wait until the HotpotQA split is added, then create one issue for both.',
    audit_event_id: 'evt_7f3a9c',
  });
}
