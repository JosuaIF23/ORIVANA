import type { Id, ISODateTime } from './common';
import type { User } from './auth';

export type WorkspaceRole = 'owner' | 'admin' | 'member' | 'viewer';

/** workspaces (PRD §10). */
export interface Workspace {
  id: Id;
  owner_user_id: Id;
  name: string;
  plan: 'personal' | 'team';
  created_at: ISODateTime;
}

/** workspace_members (PRD §10). */
export interface WorkspaceMember {
  workspace_id: Id;
  user_id: Id;
  role: WorkspaceRole;
}

/** GET /api/v1/me */
export interface MeResponse {
  user: User;
  workspace: Workspace;
  role: WorkspaceRole;
  onboarding_completed: boolean;
  counts: {
    sources: number;
    projects: number;
    pending_approvals: number;
    memories_needing_review: number;
    unread_notifications: number;
    /** v2: decisions with an open Decision Impact alert. */
    decisions_needing_review?: number;
  };
}

/** Extension: GET/PATCH /api/v1/me/preferences */
export interface Preferences {
  use_case: 'research' | 'software_development' | 'knowledge_work';
  suggest_memories_from_conversations: boolean;
  suggest_memories_from_sources: boolean;
  use_unconfirmed_candidates_in_answers: boolean;
  discard_unreviewed_candidates_after_days: 7 | 30 | 90 | null;
  default_project_id: Id | null;
  /* v2 (PRD §12 user_preferences). */
  answer_model?: Id;
  theme?: 'dark' | 'light' | 'system';
  notifications?: { decision_alerts: boolean; approvals: boolean; weekly_digest: boolean };
}

/** Extension: GET /api/v1/workspaces/{id}/deletion-preview */
export interface DeletionPreview {
  workspace_id: Id;
  workspace_name: string;
  items: Array<{ key: string; label: string; value: string }>;
  not_affected: string[];
}

/** POST /api/v1/exports, GET /api/v1/exports/{id} */
export interface DataExport {
  id: Id;
  status: 'queued' | 'running' | 'ready' | 'expired' | 'failed';
  format: 'zip_json';
  size_bytes: number | null;
  download_url: string | null;
  created_at: ISODateTime;
  expires_at: ISODateTime | null;
}

export interface ExportsResponse {
  latest: DataExport | null;
  included: string[];
}
