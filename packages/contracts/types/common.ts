/**
 * Shared primitives for the ORIVANA REST contract (PRD §14).
 * Every timestamp is an ISO 8601 string in UTC ("2026-11-11T07:20:00Z").
 */

export type Id = string;
export type ISODateTime = string;
export type ISODate = string;

/** Error codes returned in `ApiError.code`. Keep in sync with docs/API-CONTRACT.md §3. */
export type ErrorCode =
  | 'VALIDATION_FAILED'
  | 'UNAUTHENTICATED'
  | 'INVALID_CREDENTIALS'
  | 'EMAIL_NOT_VERIFIED'
  | 'TOKEN_EXPIRED'
  | 'TOKEN_USED'
  | 'RATE_LIMITED'
  | 'FORBIDDEN'
  | 'NOT_FOUND'
  | 'CONFLICT'
  | 'SOURCE_PROCESSING'
  | 'PDF_ENCRYPTED'
  | 'MODEL_TIMEOUT'
  | 'CONNECTION_NEEDS_RECONNECT'
  | 'INTERNAL';

/** Structured error body (PRD §14). */
export interface ApiError {
  code: ErrorCode;
  message: string;
  details?: Record<string, unknown>;
  request_id: string;
}

export interface ErrorResponse {
  error: ApiError;
}

/** Cursor-paginated list envelope. */
export interface Page<T> {
  items: T[];
  next_cursor: string | null;
  total: number;
}

export type ActorType = 'user' | 'agent' | 'system';

export type Origin = 'user' | 'imported' | 'model_proposed';
