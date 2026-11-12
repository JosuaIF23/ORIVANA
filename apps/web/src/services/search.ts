import type { SearchGroup, SearchRequest, SearchResponse, SearchResult } from '@contracts/types';
import { fixtures } from './core/fixtures';
import { simulate } from './core/http';
import { requireDb } from './core/session';
import type { MockDb } from './core/store';

const TYPE_LABEL: Record<string, string> = { paper: 'Paper', method: 'Method', dataset: 'Dataset', claim: 'Claim', concept: 'Concept', project: 'Project', decision: 'Decision' };

/** Searches the mock store; returns the recorded design fixture for the demo query "hybrid". */
function compute(db: MockDb, query: string): SearchGroup[] {
  const q = query.toLowerCase();
  const take = <T,>(list: T[], n: number) => list.slice(0, n);
  const sources: SearchResult[] = take(db.sources.filter((s) => s.title.toLowerCase().includes(q) || (s.authors ?? '').toLowerCase().includes(q)), 4).map((s) => ({
    id: s.id,
    type: 'source',
    type_label: s.type === 'pdf' ? 'Source · PDF' : s.type === 'markdown' ? 'Source · Markdown' : 'Source · TXT',
    icon: s.type === 'pdf' ? 'pdf' : 'markdown',
    title: s.title,
    subtitle: [s.project_name ?? 'No project', s.authors].filter(Boolean).join(' · '),
    updated_at: s.created_at,
    page: null,
  }));
  const entities: SearchResult[] = take(db.entities.filter((e) => e.canonical_name.toLowerCase().includes(q)), 4).map((e) => ({
    id: e.id,
    type: 'entity',
    type_label: TYPE_LABEL[e.entity_type],
    icon: e.entity_type,
    title: e.canonical_name,
    subtitle: `Graph · ${db.relationships.filter((r) => r.from_entity_id === e.id || r.to_entity_id === e.id).length} relationships`,
    updated_at: e.created_at,
    page: null,
  }));
  const memories: SearchResult[] = take([...db.decisions, ...db.memories].filter((m) => m.content.toLowerCase().includes(q)), 3).map((m) => ({
    id: m.id,
    type: m.decision ? 'decision' : 'memory',
    type_label: m.decision ? 'Decision' : 'Memory',
    icon: m.decision ? 'decision' : 'concept',
    title: m.decision ? `${m.decision.code} ${m.content}` : m.content,
    subtitle: `${m.project_name ?? 'Workspace'} · ${m.status}`,
    updated_at: m.updated_at,
    page: null,
  }));
  const conversations: SearchResult[] = take(db.conversations.filter((c) => c.title.toLowerCase().includes(q) || c.messages.some((m) => m.content.toLowerCase().includes(q))), 3).map((c) => ({
    id: c.id,
    type: 'conversation',
    type_label: 'Conversation',
    icon: 'conversation',
    title: c.title,
    subtitle: c.project_name ?? 'Workspace',
    updated_at: c.last_message_at,
    page: null,
  }));
  const projects: SearchResult[] = take(db.projects.filter((p) => p.name.toLowerCase().includes(q)), 2).map((p) => ({ id: p.id, type: 'project', type_label: 'Project', icon: 'project', title: p.name, subtitle: p.summary, updated_at: p.updated_at, page: null }));
  const actions: SearchResult[] = take(db.proposals.filter((p) => p.title.toLowerCase().includes(q)), 2).map((p) => ({ id: p.id, type: 'action', type_label: 'Action', icon: 'action', title: p.title, subtitle: `GitHub · ${p.status.replaceAll('_', ' ')}`, updated_at: p.created_at, page: null }));
  const groups: SearchGroup[] = [
    { key: 'sources', label: 'Sources', results: sources },
    { key: 'projects', label: 'Projects', results: projects },
    { key: 'entities', label: 'Entities & concepts', results: entities },
    { key: 'memories', label: 'Memories & decisions', results: memories },
    { key: 'conversations', label: 'Conversations', results: conversations },
    { key: 'actions', label: 'Actions', results: actions },
  ];
  return groups.filter((g) => g.results.length > 0);
}

/** POST /api/v1/search */
export function search(request: SearchRequest): Promise<SearchResponse> {
  return simulate(() => {
    const db = requireDb();
    const query = request.query.trim();
    const scope_label = `Searching all of ${db.me.workspace.name}`;
    if (!query) return { query, scope_label, total: 0, groups: [] };
    if (query.toLowerCase() === fixtures.search.hybrid.query && db.scenario === 'returning_user') return fixtures.search.hybrid;
    const groups = compute(db, query);
    return { query, scope_label, total: groups.reduce((n, g) => n + g.results.length, 0), groups };
  }, { ms: 260 });
}
