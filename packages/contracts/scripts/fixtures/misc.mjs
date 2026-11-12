// Auth, me, projects, connections, search, exports, home, workspace deletion.
import { t, write, error, USER, WORKSPACE, NOW } from './lib.mjs';

export function generateAuth() {
  write('auth/_test-accounts.json', {
    _note: 'Prototype-only test accounts used by the mock services. Not real credentials.',
    accounts: [
      { email: 'josua@example.edu', password: 'correct horse battery', scenario: 'returning_user' },
      { email: 'new@example.edu', password: 'correct horse battery', scenario: 'new_user' },
      { email: 'unverified@example.edu', password: 'correct horse battery', scenario: 'email_not_verified' },
    ],
    tokens: { verify_valid: 'vfy_demo', reset_valid: 'rst_demo', reset_expired: 'rst_expired' },
  });
  const pending = { ...USER, email_verified_at: null, status: 'pending_verification', created_at: NOW };
  write('auth/register.201.json', { user: pending, verification_sent_to: USER.email, verification_expires_at: t('15:10', 12), resend_available_at: t('15:10', 11, 42) });
  write('auth/register.409-email-taken.json', error('CONFLICT', 'An account with this email already exists.', 'req_3c1f0a77', { field: 'email' }));
  write('auth/register.422-weak-password.json', error('VALIDATION_FAILED', 'Use at least 12 characters.', 'req_3c1f0a78', { field: 'password', min_length: 12 }));
  write('auth/login.200.json', { user: USER, session: { id: 'ses_01JC9W2K', expires_at: t('15:10', 25) }, onboarding_completed: true });
  write('auth/login.200.new-user.json', { user: { ...USER, id: 'usr_new', email: 'new@example.edu', created_at: NOW }, session: { id: 'ses_01JC9W3N', expires_at: t('15:10', 25) }, onboarding_completed: false });
  write('auth/login.401-invalid-credentials.json', error('INVALID_CREDENTIALS', 'Email or password is incorrect.', 'req_8a20d4e1', { field: 'password', attempts_left: 3, lockout_minutes: 10 }));
  write('auth/login.403-email-not-verified.json', error('EMAIL_NOT_VERIFIED', 'Verify your email to continue.', 'req_51be90c2', { email: 'unverified@example.edu', sent_at: t('08:00') }));
  write('auth/login.429-rate-limited.json', error('RATE_LIMITED', 'Too many sign-in attempts. Try again in 10 minutes.', 'req_0d77e5b3', { retry_after_seconds: 600 }));
  write('auth/logout.200.json', { ok: true });
  write('auth/verify-email.200.json', { user: { ...USER, id: 'usr_new', email: 'new@example.edu', email_verified_at: NOW, created_at: NOW }, session: { id: 'ses_01JC9W3N', expires_at: t('15:10', 25) }, onboarding_completed: false });
  write('auth/verify-email.410-expired.json', error('TOKEN_EXPIRED', 'This verification link has expired.', 'req_6f02b1aa', { purpose: 'verify_email' }));
  write('auth/resend-verification.200.json', { sent_to: USER.email, resend_available_at: t('15:11') });
  write('auth/forgot-password.200.json', { sent_to: USER.email, expires_in_minutes: 30 });
  write('auth/forgot-password.429-rate-limited.json', error('RATE_LIMITED', 'You can ask for 3 links per hour.', 'req_9b4e2c10', { limit_per_hour: 3, retry_after_seconds: 1080 }));
  write('auth/reset-password.200.json', { user: USER, session: { id: 'ses_01JC9W4P', expires_at: t('15:10', 25) }, onboarding_completed: true });
  write('auth/reset-password.410-expired.json', error('TOKEN_EXPIRED', 'This link has expired.', 'req_2a9c7f31', { purpose: 'reset_password', valid_minutes: 30 }));
}

export function generateMe() {
  const me = {
    user: USER,
    workspace: WORKSPACE,
    role: 'owner',
    onboarding_completed: true,
    counts: { sources: 31, projects: 2, pending_approvals: 2, memories_needing_review: 3, unread_notifications: 1 },
  };
  write('me/get.200.json', me);
  write('me/get.new-user.200.json', {
    user: { ...USER, id: 'usr_new', email: 'new@example.edu', email_verified_at: NOW, created_at: NOW },
    workspace: { ...WORKSPACE, id: 'ws_new', owner_user_id: 'usr_new', created_at: NOW },
    role: 'owner',
    onboarding_completed: false,
    counts: { sources: 0, projects: 0, pending_approvals: 0, memories_needing_review: 0, unread_notifications: 0 },
  });
  write('me/get.401-unauthenticated.json', error('UNAUTHENTICATED', 'Your session has expired. Sign in again.', 'req_4e81c0d2'));
  write('me/delete.200.json', { ok: true });
  write('me/preferences.200.json', {
    use_case: 'research',
    suggest_memories_from_conversations: true,
    suggest_memories_from_sources: true,
    use_unconfirmed_candidates_in_answers: false,
    discard_unreviewed_candidates_after_days: 30,
    default_project_id: 'prj_rag',
  });
  write('me/sessions.200.json', {
    items: [
      { id: 'ses_01JC9W2K', user_agent: 'Chrome on Windows', ip: '203.0.113.24', created_at: t('08:02'), expires_at: t('08:02', 25), revoked_at: null, current: true },
      { id: 'ses_01JC4T8M', user_agent: 'Safari on iPhone', ip: '198.51.100.7', created_at: t('19:30', 8), expires_at: t('19:30', 22), revoked_at: null, current: false },
    ],
    next_cursor: null,
    total: 2,
  });
  write('me/sessions.revoke-others.200.json', { revoked: 1 });
}

export const PROJECTS = [
  {
    id: 'prj_rag',
    workspace_id: 'ws_personal',
    name: 'RAG Comparison',
    description: 'Comparing retrieval-augmented generation methods — GraphRAG, dense retrieval, and hybrid BM25 + vector — for the thesis evaluation.',
    status: 'active',
    created_at: t('09:00', 2),
    updated_at: t('13:10'),
    summary: 'Latest decision: use hybrid retrieval (BM25 + dense, RRF) as the default retriever.',
    counts: { sources: 14, decisions: 4, conversations: 5, pending_actions: 2 },
  },
  {
    id: 'prj_thesis',
    workspace_id: 'ws_personal',
    name: 'Thesis Proposal',
    description: 'Proposal for a thesis on graph-aware retrieval for scientific literature.',
    status: 'active',
    created_at: t('10:00', 1),
    updated_at: t('19:52', 8),
    summary: 'Outline drafted; research question narrowed to graph-aware retrieval.',
    counts: { sources: 6, decisions: 2, conversations: 2, pending_actions: 0 },
  },
];

export function generateProjects() {
  write('projects/list.200.json', { items: PROJECTS, next_cursor: null, total: PROJECTS.length });
  write('projects/detail.200.json', {
    _note: 'GET /api/v1/projects/{id} keyed by id.',
    items: {
      prj_rag: {
        ...PROJECTS[0],
        current_status: { text: 'Hybrid retrieval is the default. Next: re-run the evaluation and add a multi-hop split.', based_on_memory_id: 'dec_rag_04', based_on_label: 'Based on confirmed decision D-04 · 6 Nov' },
        recent_changes: [
          { at: t('13:58'), text: '3 sources added, 1 indexing' },
          { at: t('14:34'), text: '2 GitHub issues proposed' },
          { at: t('10:00', 6), text: 'D-04 confirmed, D-02 superseded' },
        ],
      },
      prj_thesis: {
        ...PROJECTS[1],
        current_status: { text: 'Outline drafted. Next: write the motivation chapter around Q1.', based_on_memory_id: 'dec_thesis_01', based_on_label: 'Based on confirmed decision D-01 · 4 Nov' },
        recent_changes: [
          { at: t('11:12'), text: '1 source failed to parse' },
          { at: t('19:52', 8), text: 'D-02 confirmed' },
        ],
      },
    },
  });
  write('projects/create.201.json', { ...PROJECTS[0], id: 'prj_new_rag', workspace_id: 'ws_new', created_at: NOW, updated_at: NOW, summary: 'No decisions yet.', counts: { sources: 0, decisions: 0, conversations: 0, pending_actions: 0 } });
  write('projects/patch.200.json', { ...PROJECTS[0], description: 'Comparing GraphRAG, dense, and hybrid retrieval for the thesis evaluation.', updated_at: NOW });
  write('projects/delete.200.json', { ok: true });
  write('projects/get.404.json', error('NOT_FOUND', 'Project not found.', 'req_d00d0001'));
}

const GITHUB = {
  id: 'conn_github',
  workspace_id: 'ws_personal',
  provider: 'github',
  account_label: '@jsilalahi',
  status: 'connected',
  connected_at: t('09:00', 2),
  last_checked_at: t('15:00'),
  last_sync_at: t('15:00'),
  health: 'passed',
  status_detail: null,
  repositories: [
    { full_name: 'lab/rag-experiments', visibility: 'public', labels: ['evaluation', 'retrieval', 'bug', 'documentation'] },
    { full_name: 'lab/thesis-notes', visibility: 'private', labels: ['writing', 'todo'] },
  ],
  grant: {
    id: 'grant_github',
    connection_id: 'conn_github',
    approval_policy: 'every_write',
    granted_at: t('09:00', 2),
    scopes: [
      { kind: 'read', label: 'Read files and metadata in the 2 selected repositories', scope: 'contents: read' },
      { kind: 'read', label: 'Read issues and their comments', scope: 'issues: read' },
      { kind: 'write_with_approval', label: 'Create new issues — only after you approve each one in Approvals', scope: 'issues: write' },
      { kind: 'not_granted', label: 'Not granted: pushing code, commenting, closing or deleting anything, changing settings', scope: null },
    ],
  },
};

const CATALOG = [
  { provider: 'github', name: 'GitHub', tagline: 'Read repositories and issues; create issues after approval', availability: 'available', workaround: null },
  { provider: 'obsidian', name: 'Obsidian sync', tagline: 'Read notes from a local vault', availability: 'coming_later', workaround: 'Until sync ships, upload your Markdown notes — links and headings are kept.' },
  { provider: 'google_drive', name: 'Google Drive', tagline: 'Read PDFs and docs from chosen folders', availability: 'coming_later', workaround: 'Download files from Drive and upload them to Sources for now.' },
];

export function generateConnections() {
  write('connections/list.200.json', { connections: [GITHUB], catalog: CATALOG });
  write('connections/list.needs-reconnect.200.json', {
    connections: [{ ...GITHUB, status: 'needs_reconnect', health: 'failed', status_detail: 'GitHub rejected the stored token on 11 Nov at 09:02. Reads are paused and pending proposals can’t run until you reconnect.' }],
    catalog: CATALOG,
  });
  write('connections/list.empty.200.json', { connections: [], catalog: CATALOG });
  write('connections/start.200.json', { provider: 'github', authorize_url: 'https://github.com/login/oauth/authorize?client_id=orivana-demo&scope=repo%3Aissues', requested_scopes: ['contents:read', 'issues:read', 'issues:write'] });
  write('connections/callback.200.json', GITHUB);
  write('connections/reconnect.200.json', { ...GITHUB, last_checked_at: NOW });
  write('connections/delete.200.json', { revoked_connection_id: 'conn_github', cancelled_proposals: 2 });
  write('connections/repositories.200.json', { items: GITHUB.repositories });
}

export function generateSearch() {
  write('search/hybrid.200.json', {
    _note: 'POST /api/v1/search {"query":"hybrid"}',
    query: 'hybrid',
    scope_label: 'Searching all of Personal workspace',
    total: 7,
    groups: [
      {
        key: 'sources',
        label: 'Sources',
        results: [
          { id: 'src_okafor2025', type: 'source', type_label: 'Source · PDF', icon: 'pdf', title: 'Hybrid Retrieval Under Distribution Shift', subtitle: 'RAG Comparison · p. 6 matches', updated_at: t('09:12', 3), page: 6 },
          { id: 'src_santos2025', type: 'source', type_label: 'Source · PDF', icon: 'pdf', title: 'Fusion Retrieval Revisited: BM25 + Dense', subtitle: 'RAG Comparison · p. 4 matches', updated_at: t('15:30', 1), page: 4 },
        ],
      },
      {
        key: 'entities',
        label: 'Entities & concepts',
        results: [
          { id: 'ent_m_hybrid', type: 'entity', type_label: 'Method', icon: 'method', title: 'Hybrid retrieval', subtitle: 'Graph · 4 papers · confirmed', updated_at: t('10:00', 6), page: null },
          { id: 'ent_c_hybridbeats', type: 'entity', type_label: 'Claim', icon: 'claim', title: 'Hybrid beats dense-only', subtitle: 'Graph · 2 supporting, 1 candidate contradiction', updated_at: t('10:00', 10), page: null },
        ],
      },
      {
        key: 'memories',
        label: 'Memories & decisions',
        results: [{ id: 'dec_rag_04', type: 'decision', type_label: 'Decision', icon: 'decision', title: 'D-04 Use hybrid retrieval as the default retriever', subtitle: 'RAG Comparison · confirmed', updated_at: t('10:00', 6), page: null }],
      },
      {
        key: 'conversations',
        label: 'Conversations',
        results: [{ id: 'conv_hybrid', type: 'conversation', type_label: 'Conversation', icon: 'conversation', title: 'Hybrid vs dense-only results', subtitle: 'RAG Comparison', updated_at: t('14:20'), page: null }],
      },
      {
        key: 'actions',
        label: 'Actions',
        results: [{ id: 'prop_01JC9X4M7Q', type: 'action', type_label: 'Action', icon: 'action', title: 'Create issue: Re-run eval with hybrid retrieval', subtitle: 'GitHub · awaiting approval', updated_at: t('14:34'), page: null }],
      },
    ],
  });
  write('search/empty.200.json', { query: 'quantum annealing', scope_label: 'Searching all of Personal workspace', total: 0, groups: [] });
}

export function generateMisc() {
  write('exports/list.200.json', {
    latest: { id: 'exp_01JBX0', status: 'expired', format: 'zip_json', size_bytes: 192937984, download_url: null, created_at: t('10:00', 2), expires_at: t('10:00', 9) },
    included: [
      'Original files (31 sources)',
      'Extracted text with page and section locations',
      'Graph entities, relationships, and their evidence',
      'Memories and decision records, with history',
      'Conversations and their citations',
      'Action proposals and audit log',
    ],
  });
  write('exports/create.202.json', { id: 'exp_01JCA1', status: 'queued', format: 'zip_json', size_bytes: null, download_url: null, created_at: NOW, expires_at: null });
  write('exports/get.200.json', { id: 'exp_01JCA1', status: 'ready', format: 'zip_json', size_bytes: 193986560, download_url: 'https://files.orivana.example/exports/exp_01JCA1.zip', created_at: NOW, expires_at: t('15:10', 18) });
  write('workspaces/deletion-preview.200.json', {
    workspace_id: 'ws_personal',
    workspace_name: 'Personal workspace',
    items: [
      { key: 'sources', label: 'Sources and their original files', value: '31' },
      { key: 'chunks', label: 'Extracted text, chunks, and embeddings', value: '2,140 chunks' },
      { key: 'graph', label: 'Graph entities, relationships, and evidence links', value: '186 · 412' },
      { key: 'memories', label: 'Memories and decision records', value: '11 · 6' },
      { key: 'conversations', label: 'Conversations and their citations', value: '23' },
      { key: 'proposals', label: 'Pending action proposals (cancelled first)', value: '2' },
      { key: 'connection', label: 'GitHub connection and its stored tokens', value: 'Revoked' },
    ],
    not_affected: [
      'Issues already created on GitHub stay there.',
      'Audit events are kept, stripped of content, as a record that deletion happened.',
      'Your account and sign-in stay active.',
    ],
  });
  write('workspaces/delete-data.200.json', { ok: true });
  write('workspaces/delete-data.422-confirmation.json', error('VALIDATION_FAILED', 'Type the workspace name exactly to confirm.', 'req_e1e2e3e4', { field: 'confirm_name' }));
  write('home/suggestions.200.json', {
    basis: 'Based on what you added and asked this week.',
    items: [
      { id: 'sug_1', text: 'Review 5 candidate relationships in RAG Comparison', target: { kind: 'graph_candidates', project_id: 'prj_rag' } },
      { id: 'sug_2', text: 'Confirm 3 candidate memories from today’s conversation', target: { kind: 'memory_review', project_id: 'prj_rag' } },
    ],
  });
  write('_errors/500-internal.json', error('INTERNAL', 'Something went wrong on our side. Try again.', 'req_ffff0001'));
}
