/**
 * Mock clock. The prototype pretends it is Wednesday 11 Nov 2026, 15:10 in
 * Asia/Jakarta (docs/design/SCREENS.md §3 #1). Time keeps moving from there.
 */
export const MOCK_EPOCH = Date.parse('2026-11-11T08:10:00Z');
const startedAt = Date.now();

export function now(): Date {
  return new Date(MOCK_EPOCH + (Date.now() - startedAt));
}

export function nowIso(): string {
  return now().toISOString().replace(/\.\d{3}Z$/, 'Z');
}

export const DISPLAY_TIME_ZONE = 'Asia/Jakarta';
