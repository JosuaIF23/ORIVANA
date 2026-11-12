import type { Id, ISODateTime } from './common';
import type { ZoteroCollection } from './zotero';

export type ConnectionStatus = 'connected' | 'needs_reconnect' | 'revoked';

/** One permission in plain language plus the raw provider scope (UI.md §4.11). */
export interface PermissionScope {
  kind: 'read' | 'write_with_approval' | 'not_granted';
  label: string;
  scope: string | null;
}

/** permission_grants (PRD §10). */
export interface PermissionGrant {
  id: Id;
  connection_id: Id;
  scopes: PermissionScope[];
  approval_policy: 'every_write';
  granted_at: ISODateTime;
}

export interface Repository {
  full_name: string;
  visibility: 'public' | 'private';
  labels: string[];
}

/** tool_connections (PRD §10). Credentials are never part of the response. */
export interface ToolConnection {
  id: Id;
  workspace_id: Id;
  /** v2 adds `zotero` (read only). */
  provider: 'github' | 'zotero';
  account_label: string;
  status: ConnectionStatus;
  connected_at: ISODateTime;
  last_checked_at: ISODateTime;
  last_sync_at: ISODateTime;
  health: 'passed' | 'failed';
  status_detail: string | null;
  repositories: Repository[];
  grant: PermissionGrant;
  /** v2: Zotero collections being synced. */
  collections?: Array<Pick<ZoteroCollection, 'key' | 'name' | 'item_count'>>;
  library_label?: string | null;
}

/** Providers that are listed but not yet connectable. */
export interface ProviderCatalogItem {
  provider: 'github' | 'obsidian' | 'google_drive' | 'zotero' | 'notion' | 'mcp';
  name: string;
  tagline: string;
  availability: 'available' | 'coming_later';
  workaround: string | null;
}

export interface ConnectionsResponse {
  connections: ToolConnection[];
  catalog: ProviderCatalogItem[];
}

/** POST /api/v1/connections → redirect target for OAuth. */
export interface StartConnectionResponse {
  provider: 'github' | 'zotero';
  authorize_url: string;
  requested_scopes: string[];
}
