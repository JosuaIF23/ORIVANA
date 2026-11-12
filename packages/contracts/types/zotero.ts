import type { Id, ISODateTime } from './common';

/** Zotero mapping for a source (zotero_links, PRD §12). Read-only: nothing is written back. */
export interface ZoteroItemRef {
  library_id: string;
  item_key: string;
  item_version: number;
  collection_key: string;
  collection_name: string;
  last_synced_at: ISODateTime;
  has_pdf: boolean;
  annotation_count: number;
  /** The item was removed in Zotero; the user chooses to delete or keep it. */
  removed_in_zotero: boolean;
}

/** GET /api/v1/connections/zotero/collections */
export interface ZoteroCollection {
  key: string;
  name: string;
  parent_key: string | null;
  item_count: number;
  pdf_count: number;
  /** Already synced into a project. */
  synced_project_id: Id | null;
  last_synced_at: ISODateTime | null;
}

export interface ZoteroCollectionsResponse {
  library_label: string;
  collections: ZoteroCollection[];
}

/** POST /api/v1/connections/zotero/sync */
export interface ZoteroSyncRequest {
  collection_keys: string[];
  project_id: Id | null;
}

export interface ZoteroSyncItem {
  item_key: string;
  title: string;
  source_id: Id | null;
  state: 'new' | 'updated' | 'unchanged' | 'removed' | 'no_pdf';
}

export interface ZoteroSyncResponse {
  sync_id: Id;
  status: 'queued' | 'running' | 'succeeded' | 'failed';
  project_id: Id | null;
  collection_keys: string[];
  counts: { items: number; with_pdf: number; new: number; updated: number; unchanged: number; removed: number };
  items: ZoteroSyncItem[];
  started_at: ISODateTime;
  finished_at: ISODateTime | null;
}

/** Extension: PATCH /api/v1/sources/{id} for "Keep" on a source removed in Zotero. */
export interface UpdateSourceRequest {
  keep_removed_zotero_item?: true;
}
