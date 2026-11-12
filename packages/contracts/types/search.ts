import type { Id, ISODateTime } from './common';

export type SearchResultType =
  | 'source'
  | 'project'
  | 'entity'
  | 'memory'
  | 'decision'
  | 'conversation'
  | 'action'
  | 'claim';

/** POST /api/v1/search */
export interface SearchRequest {
  query: string;
  project_id?: Id | null;
  types?: SearchResultType[];
  limit?: number;
}

export interface SearchResult {
  id: Id;
  type: SearchResultType;
  /** Type label shown in the left column, e.g. "Source · PDF", "Method". */
  type_label: string;
  /** Icon key for the type column. */
  icon: 'pdf' | 'markdown' | 'zotero' | 'paper' | 'method' | 'dataset' | 'claim' | 'concept' | 'project' | 'decision' | 'conversation' | 'action';
  title: string;
  subtitle: string;
  updated_at: ISODateTime;
  /** Page to open for sources (deep link). */
  page: number | null;
}

export interface SearchGroup {
  key: 'sources' | 'entities' | 'memories' | 'conversations' | 'projects' | 'actions' | 'claims';
  label: string;
  results: SearchResult[];
}

export interface SearchResponse {
  query: string;
  scope_label: string;
  total: number;
  groups: SearchGroup[];
}
