// v2: answer models (GET /models) and the read-only Zotero connector.
import { SOURCES, ZOTERO_LIBRARY, ZOTERO_LAST_SYNC } from './sources.mjs';
import { t, write, error, NOW } from './lib.mjs';

export const DEFAULT_MODEL = { id: 'claude-sonnet-5-5', name: 'Claude Sonnet 5.5' };

export const MODELS = {
  answer_models: [
    { id: 'claude-sonnet-5-5', name: 'Claude Sonnet 5.5', provider: 'Anthropic', tier: 'strong', description: 'Careful, well-cited answers for comparisons and synthesis.', is_default: true },
    { id: 'claude-haiku-5-5', name: 'Claude Haiku 5.5', provider: 'Anthropic', tier: 'fast', description: 'Quick answers for lookups and short questions.', is_default: false },
    { id: 'gpt-5', name: 'GPT-5', provider: 'OpenAI', tier: 'strong', description: 'Strong reasoning across long evidence packets.', is_default: false },
    { id: 'gpt-5-mini', name: 'GPT-5 mini', provider: 'OpenAI', tier: 'fast', description: 'Fast, low-cost answers for simple questions.', is_default: false },
  ],
  managed: [
    { task: 'extraction', name: 'Claude Haiku 5.5', provider: 'Anthropic' },
    { task: 'embeddings', name: 'text-embedding-3-large', provider: 'OpenAI' },
    { task: 'decision_impact', name: 'Claude Sonnet 5.5', provider: 'Anthropic' },
  ],
  providers: [
    { name: 'Anthropic', purpose: 'Answers, extraction, and Decision Impact checks' },
    { name: 'OpenAI', purpose: 'Embeddings, and answers when you choose a GPT model' },
  ],
};

export const ZOTERO_COLLECTIONS = [
  { key: 'ZC7K2RAG', name: 'RAG Comparison', parent_key: null, item_count: 18, pdf_count: 17, synced_project_id: 'prj_rag', last_synced_at: ZOTERO_LAST_SYNC },
  { key: 'ZC7K2MHP', name: 'Multi-hop', parent_key: 'ZC7K2RAG', item_count: 4, pdf_count: 4, synced_project_id: null, last_synced_at: null },
  { key: 'ZC9T4THS', name: 'Thesis — graph retrieval', parent_key: null, item_count: 9, pdf_count: 8, synced_project_id: null, last_synced_at: null },
  { key: 'ZC3R8RDG', name: 'To read', parent_key: null, item_count: 7, pdf_count: 6, synced_project_id: null, last_synced_at: null },
];

export const ZOTERO_CONNECTION = {
  id: 'conn_zotero',
  workspace_id: 'ws_personal',
  provider: 'zotero',
  account_label: 'josua-silalahi',
  status: 'connected',
  connected_at: t('09:05', 2),
  last_checked_at: ZOTERO_LAST_SYNC,
  last_sync_at: ZOTERO_LAST_SYNC,
  health: 'passed',
  status_detail: null,
  repositories: [],
  library_label: ZOTERO_LIBRARY.label,
  collections: [{ key: 'ZC7K2RAG', name: 'RAG Comparison', item_count: 18 }],
  grant: {
    id: 'grant_zotero',
    connection_id: 'conn_zotero',
    approval_policy: 'every_write',
    granted_at: t('09:05', 2),
    scopes: [
      { kind: 'read', label: 'Read your items and their metadata', scope: 'library:read' },
      { kind: 'read', label: 'Download attached PDFs', scope: 'files:read' },
      { kind: 'read', label: 'Read your highlights and notes', scope: 'notes:read' },
      { kind: 'not_granted', label: 'Change or delete anything in your Zotero library', scope: null },
    ],
  },
};

const zoteroSources = SOURCES.filter((s) => s.type === 'zotero');

export function generateModelsAndZotero() {
  write('models/list.200.json', { _note: 'GET /api/v1/models', ...MODELS });
  write('connections/zotero.collections.200.json', { _note: 'GET /api/v1/connections/zotero/collections', library_label: ZOTERO_LIBRARY.label, collections: ZOTERO_COLLECTIONS });
  write('connections/zotero.sync.202.json', {
    _note: 'POST /api/v1/connections/zotero/sync — returned while running; the mock advances it to succeeded.',
    sync_id: 'zsync_01JCE7',
    status: 'running',
    project_id: 'prj_rag',
    collection_keys: ['ZC7K2RAG'],
    counts: { items: 18, with_pdf: 17, new: 0, updated: 0, unchanged: 17, removed: 1 },
    items: zoteroSources.map((s) => ({ item_key: s.zotero.item_key, title: s.title, source_id: s.id, state: s.zotero.removed_in_zotero ? 'removed' : 'unchanged' })),
    started_at: NOW,
    finished_at: null,
  });
  write('connections/zotero.sync.409-running.json', error('CONFLICT', 'A Zotero sync is already running. Wait for it to finish.', 'req_2a3b4c5d', { sync_id: 'zsync_01JCE7' }));
  write('sources/patch.keep-removed.200.json', { ...zoteroSources.find((s) => s.zotero.removed_in_zotero), _note: 'PATCH /api/v1/sources/{id} {keep_removed_zotero_item: true} — the item stays; the flag is kept so the badge still explains it.' });
}
