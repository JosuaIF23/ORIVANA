import type { ApiError } from './common';
import type { Message, MessageCitation } from './conversation';

/**
 * Server-Sent Events emitted by
 * GET /api/v1/conversations/{id}/messages/{message_id}/stream (PRD §9.5).
 * Each event has an `event:` name and a JSON `data:` payload.
 */

export interface RetrievalStep {
  label: string;
  state: 'done' | 'active' | 'pending';
}

export interface StatusEventData {
  phase: 'retrieving' | 'generating';
  steps: RetrievalStep[];
  passages_found: number;
  sources_found: number;
  sources: Array<{ label: string; passages: number }>;
}

export interface TokenEventData {
  text: string;
}

export type CitationEventData = MessageCitation;

export interface DoneEventData {
  message: Message;
}

export type ErrorEventData = ApiError & { retryable: boolean };

export type StreamEvent =
  | { event: 'status'; data: StatusEventData }
  | { event: 'token'; data: TokenEventData }
  | { event: 'citation'; data: CitationEventData }
  | { event: 'done'; data: DoneEventData }
  | { event: 'error'; data: ErrorEventData };

/** Fixture format for a recorded stream: events plus the delay before each. */
export interface RecordedStream {
  message_id: string;
  events: Array<StreamEvent & { delay_ms: number }>;
}
