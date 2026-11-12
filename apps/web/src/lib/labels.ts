import type { ActorType, SourceType } from '@contracts/types';

/** Short source-type label (UI.md §4.6 type badge). */
export const SOURCE_TYPE_LABEL: Record<SourceType, string> = { pdf: 'PDF', markdown: 'Markdown', txt: 'TXT', zotero: 'Zotero' };

/** Who did something, as shown in Activity. */
export const ACTOR_LABEL: Record<ActorType, string> = { user: 'User', agent: 'Agent', system: 'System', external_client: 'External client' };
