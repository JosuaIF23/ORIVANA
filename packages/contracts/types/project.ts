import type { Id, ISODateTime } from './common';

/** projects (PRD §10) plus read-model counters the UI needs. */
export interface Project {
  id: Id;
  workspace_id: Id;
  name: string;
  description: string;
  status: 'active' | 'archived';
  created_at: ISODateTime;
  updated_at: ISODateTime;
  /** One-line summary of the latest confirmed decision, shown on project cards. */
  summary: string;
  counts: {
    sources: number;
    decisions: number;
    conversations: number;
    pending_actions: number;
    /* v2 tab counts */
    claims?: number;
    activity?: number;
    decisions_needing_review?: number;
  };
}

/** GET /api/v1/projects/{id} */
export interface ProjectDetail extends Project {
  current_status: {
    text: string;
    based_on_memory_id: Id | null;
    based_on_label: string;
  };
  recent_changes: Array<{ at: ISODateTime; text: string }>;
}

export interface CreateProjectRequest {
  name: string;
  description?: string;
}

export interface UpdateProjectRequest {
  name?: string;
  description?: string;
  status?: Project['status'];
}
