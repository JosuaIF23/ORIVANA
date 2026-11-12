import type { Id } from './common';

/** Extension: GET /api/v1/home/suggestions — derived from explicit user activity only. */
export interface Suggestion {
  id: Id;
  text: string;
  target: { kind: 'graph_candidates' | 'memory_review' | 'source_failed'; project_id: Id | null };
}

export interface SuggestionsResponse {
  basis: string;
  items: Suggestion[];
}
