import type { ApiError, ErrorCode, ErrorResponse } from '@contracts/types';

/** Error thrown by every mock service; mirrors the REST error body (API-CONTRACT §2). */
export class ApiRequestError extends Error {
  readonly status: number;
  readonly error: ApiError;

  constructor(status: number, error: ApiError) {
    super(error.message);
    this.name = 'ApiRequestError';
    this.status = status;
    this.error = error;
  }
}

export function isApiError(value: unknown): value is ApiRequestError {
  return value instanceof ApiRequestError;
}

let requestCounter = 0;

export function nextRequestId(): string {
  requestCounter += 1;
  return `req_${(0x1a2b3c00 + requestCounter * 2741).toString(16).slice(-8)}`;
}

const STATUS_BY_CODE: Record<ErrorCode, number> = {
  VALIDATION_FAILED: 422,
  UNAUTHENTICATED: 401,
  INVALID_CREDENTIALS: 401,
  EMAIL_NOT_VERIFIED: 403,
  TOKEN_EXPIRED: 410,
  TOKEN_USED: 410,
  RATE_LIMITED: 429,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  SOURCE_PROCESSING: 409,
  PDF_ENCRYPTED: 422,
  MODEL_TIMEOUT: 504,
  CONNECTION_NEEDS_RECONNECT: 409,
  INTERNAL: 500,
};

/** Throws an error built from a fixture body (`{ error: {...} }`). */
export function fail(fixture: ErrorResponse, overrides?: Partial<ApiError>): never {
  const error = { ...fixture.error, ...overrides, request_id: nextRequestId() };
  throw new ApiRequestError(STATUS_BY_CODE[error.code], error);
}

/** Throws an ad-hoc error with the contract shape. */
export function failWith(code: ErrorCode, message: string, details?: Record<string, unknown>): never {
  throw new ApiRequestError(STATUS_BY_CODE[code], { code, message, details, request_id: nextRequestId() });
}

export interface LatencyOptions {
  /** Base latency in ms; jittered by ±30%. */
  ms?: number;
}

/** Test hook: set to 0 in unit tests. */
export const latencyConfig = { scale: 1 };

export function delay(ms: number): Promise<void> {
  const scaled = ms * latencyConfig.scale;
  if (scaled <= 0) return Promise.resolve();
  return new Promise((resolve) => setTimeout(resolve, scaled));
}

/**
 * Simulates a REST round trip: waits, runs the handler against the store, and
 * returns a deep copy so callers can never mutate the store by accident.
 */
export async function simulate<T>(handler: () => T, { ms = 380 }: LatencyOptions = {}): Promise<T> {
  const jitter = ms * (0.7 + Math.random() * 0.6);
  await delay(jitter);
  const result = handler();
  return structuredClone(result);
}
