import type { Id, ISODateTime } from './common';
import type { EntityType } from './graph';

/** conversations (PRD §10). */
export interface Conversation {
  id: Id;
  workspace_id: Id;
  project_id: Id | null;
  project_name: string | null;
  user_id: Id;
  title: string;
  created_at: ISODateTime;
  last_message_at: ISODateTime;
}

/**
 * message_citations (PRD §10), denormalised with the source location so the
 * evidence panel can render without extra requests.
 */
export interface MessageCitation {
  id: Id;
  message_id: Id;
  chunk_id: Id;
  ordinal: number;
  source_id: Id;
  source_title: string;
  source_label: string;
  source_meta: string;
  page: number;
  section: string;
  /** Full passage text; `char_start`/`char_end` mark the quoted span inside it. */
  passage: string;
  quote: string;
  char_start: number;
  char_end: number;
}

export type MessageStatus = 'streaming' | 'complete' | 'cancelled' | 'error';

/** How the answer is shaped (Assistant states in UI.md §4.5). */
export type AnswerKind = 'answer' | 'no_evidence' | 'conflicting';

export interface ConflictPosition {
  label: string;
  title: string;
  /** Text with the quoted span from the cited passage. */
  quote: string;
  context: string;
  citation_ordinal: number;
}

/** messages (PRD §10). `content` is Markdown with citation markers like `[1]`. */
export interface Message {
  id: Id;
  conversation_id: Id;
  role: 'user' | 'assistant';
  content: string;
  status: MessageStatus;
  created_at: ISODateTime;
  answer_kind: AnswerKind | null;
  sources_used: number | null;
  sources_searched: number | null;
  limitations: string | null;
  positions: ConflictPosition[] | null;
  inference: string | null;
  suggestion: string | null;
  related_entities: Array<{ id: Id; name: string; entity_type: EntityType }>;
  citations: MessageCitation[];
  proposal_id: Id | null;
  error: { code: string; message: string; retryable: boolean } | null;
  cancelled_at: ISODateTime | null;
}

/** GET /api/v1/conversations/{id} */
export interface ConversationDetail extends Conversation {
  messages: Message[];
  scope: { project_id: Id | null; label: string; source_count: number };
}

export interface CreateConversationRequest {
  project_id: Id | null;
  title?: string;
}

/** POST /api/v1/conversations/{id}/messages */
export interface SendMessageRequest {
  content: string;
  project_id: Id | null;
}

export interface SendMessageResponse {
  user_message: Message;
  /** Assistant reply id; open the SSE stream with it (PRD §9.5). */
  message_id: Id;
}

export interface CancelMessageResponse {
  message_id: Id;
  status: 'cancelled';
}

/** POST /api/v1/messages/{id}/feedback */
export interface MessageFeedbackRequest {
  kind: 'incorrect';
  note?: string;
}
