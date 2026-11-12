/**
 * In-memory mock database. Seeded from fixtures on sign-in and mutated by the
 * services for the rest of the browser session (API-CONTRACT §6).
 */
import type {
  ActionProposal,
  AuditEvent,
  Conversation,
  ConversationDetail,
  DataExport,
  Entity,
  MeResponse,
  Memory,
  Preferences,
  ProjectDetail,
  Relationship,
  RelationshipDetail,
  Session,
  SourceDetail,
  ToolConnection,
  ProviderCatalogItem,
} from '@contracts/types';
import { fixtures } from './fixtures';

export type Scenario = 'returning_user' | 'new_user';

export interface MockDb {
  scenario: Scenario;
  me: MeResponse;
  preferences: Preferences;
  sessions: Session[];
  projects: ProjectDetail[];
  sources: SourceDetail[];
  recentSourceIds: string[];
  conversations: ConversationDetail[];
  entities: Entity[];
  relationships: RelationshipDetail[];
  memories: Memory[];
  decisions: Memory[];
  proposals: ActionProposal[];
  connections: ToolConnection[];
  catalog: ProviderCatalogItem[];
  audit: AuditEvent[];
  latestExport: DataExport | null;
  exportIncluded: string[];
}

function seed(scenario: Scenario): MockDb {
  const f = structuredClone(fixtures);
  if (scenario === 'new_user') {
    return {
      scenario,
      me: f.me.newUser,
      preferences: { ...f.me.preferences, default_project_id: null },
      sessions: f.me.sessions.items.slice(0, 1),
      projects: [],
      sources: [],
      recentSourceIds: [],
      conversations: [],
      entities: [],
      relationships: [],
      memories: [],
      decisions: [],
      proposals: [],
      connections: [],
      catalog: f.connections.list.catalog,
      audit: [],
      latestExport: null,
      exportIncluded: f.exports.list.included,
    };
  }
  const relationshipDetails = f.graph.relationships.items;
  return {
    scenario,
    me: f.me.ok,
    preferences: f.me.preferences,
    sessions: f.me.sessions.items,
    projects: Object.values(f.projects.detail.items),
    sources: f.sources.list.items.map((s) => f.sources.detail.items[s.id] ?? { ...s, sections: [], entities: [], entity_count: 0, relationships: [], relationship_count: 0, ingestion_history: [], suggested_questions: [] }),
    recentSourceIds: f.sources.recent.items.map((s) => s.id),
    conversations: f.conversations.list.items.map((c) => f.conversations.detail.items[c.id]),
    entities: f.graph.subgraph.nodes,
    relationships: f.graph.subgraph.edges.map((e: Relationship) => relationshipDetails[e.id]),
    memories: f.memories.list.items,
    decisions: f.memories.decisions.items,
    proposals: [...f.proposals.pending.items, ...f.proposals.decided.items],
    connections: f.connections.list.connections,
    catalog: f.connections.list.catalog,
    audit: f.audit.items,
    latestExport: f.exports.list.latest,
    exportIncluded: f.exports.list.included,
  };
}

let db: MockDb | null = null;

const SESSION_KEY = 'orivana.mock.session';

function readSession(): Scenario | null {
  try {
    const value = sessionStorage.getItem(SESSION_KEY);
    return value === 'returning_user' || value === 'new_user' ? value : null;
  } catch {
    return null;
  }
}

/** Starts a mock session (sign-in) and seeds the database for it. */
export function startSession(scenario: Scenario): MockDb {
  db = seed(scenario);
  try {
    sessionStorage.setItem(SESSION_KEY, scenario);
  } catch {
    /* storage unavailable: session lasts until reload */
  }
  return db;
}

export function endSession(): void {
  db = null;
  try {
    sessionStorage.removeItem(SESSION_KEY);
  } catch {
    /* ignore */
  }
}

/** Returns the database for the signed-in session, or null when signed out. */
export function currentDb(): MockDb | null {
  if (db) return db;
  const scenario = readSession();
  if (scenario) db = seed(scenario);
  return db;
}

export function conversationSummary(c: ConversationDetail): Conversation {
  const { messages: _messages, scope: _scope, ...rest } = c;
  return rest;
}
