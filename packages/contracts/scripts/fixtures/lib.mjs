// Helpers shared by the fixture generators.
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

export const FIXTURES_DIR = join(dirname(fileURLToPath(import.meta.url)), '..', '..', 'fixtures');

/** Mock "now": Wednesday 11 Nov 2026, 15:10 in Asia/Jakarta (UTC+7). */
export const NOW = '2026-11-11T08:10:00Z';

/**
 * Local Jakarta wall-clock time → UTC ISO string.
 * `day` is the day of November 2026 (default 11 = today).
 */
export function t(hhmm, day = 11, seconds = 0) {
  const [h, m] = hhmm.split(':').map(Number);
  const date = new Date(Date.UTC(2026, 10, day, h - 7, m, seconds));
  return date.toISOString().replace('.000Z', 'Z');
}

/** Same as `t` for October 2026. */
export function tOct(hhmm, day) {
  const [h, m] = hhmm.split(':').map(Number);
  return new Date(Date.UTC(2026, 9, day, h - 7, m)).toISOString().replace('.000Z', 'Z');
}

export function write(relPath, data) {
  const file = join(FIXTURES_DIR, relPath);
  mkdirSync(dirname(file), { recursive: true });
  writeFileSync(file, JSON.stringify(data, null, 2) + '\n', 'utf8');
}

export function error(code, message, request_id, details) {
  return { error: details ? { code, message, details, request_id } : { code, message, request_id } };
}

/** Wraps `quote` inside `passage`, returning offsets for highlighting. */
export function span(passage, quote) {
  const char_start = passage.indexOf(quote);
  if (char_start < 0) throw new Error(`Quote not found in passage: ${quote}`);
  return { passage, quote, char_start, char_end: char_start + quote.length };
}

export const USER = {
  id: 'usr_josua',
  email: 'josua@example.edu',
  name: 'Josua Silalahi',
  email_verified_at: '2026-10-01T02:00:00Z',
  status: 'active',
  initials: 'JS',
  time_zone: 'Asia/Jakarta',
  created_at: '2026-10-01T01:55:00Z',
};

export const WORKSPACE = {
  id: 'ws_personal',
  owner_user_id: 'usr_josua',
  name: 'Personal workspace',
  plan: 'personal',
  created_at: '2026-10-01T01:55:00Z',
};
