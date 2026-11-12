import { DISPLAY_TIME_ZONE, now } from './clock';

const timeFmt = new Intl.DateTimeFormat('en-GB', { hour: '2-digit', minute: '2-digit', hour12: false, timeZone: DISPLAY_TIME_ZONE });
const timeSecFmt = new Intl.DateTimeFormat('en-GB', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false, timeZone: DISPLAY_TIME_ZONE });
const dayMonthFmt = new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'short', timeZone: DISPLAY_TIME_ZONE });
const dayMonthYearFmt = new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'short', year: 'numeric', timeZone: DISPLAY_TIME_ZONE });
const weekdayFmt = new Intl.DateTimeFormat('en-GB', { weekday: 'short', timeZone: DISPLAY_TIME_ZONE });
const longDateFmt = new Intl.DateTimeFormat('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric', timeZone: DISPLAY_TIME_ZONE });
const groupFmt = new Intl.DateTimeFormat('en-GB', { weekday: 'long', day: 'numeric', month: 'long', timeZone: DISPLAY_TIME_ZONE });
const keyFmt = new Intl.DateTimeFormat('en-CA', { year: 'numeric', month: '2-digit', day: '2-digit', timeZone: DISPLAY_TIME_ZONE });

/** Calendar day key in the display time zone, e.g. "2026-11-11". */
export function dayKey(iso: string | Date): string {
  return keyFmt.format(typeof iso === 'string' ? new Date(iso) : iso);
}

function daysAgo(iso: string): number {
  const a = Date.parse(`${dayKey(iso)}T00:00:00Z`);
  const b = Date.parse(`${dayKey(now())}T00:00:00Z`);
  return Math.round((b - a) / 86_400_000);
}

/** "14:20" */
export function formatTime(iso: string): string {
  return timeFmt.format(new Date(iso));
}

/** "14:41:02" */
export function formatTimeSeconds(iso: string): string {
  return timeSecFmt.format(new Date(iso));
}

/** "3 Nov" */
export function formatDayMonth(iso: string): string {
  return dayMonthFmt.format(new Date(iso));
}

/** "3 Nov 2026" */
export function formatDate(iso: string): string {
  return dayMonthYearFmt.format(new Date(iso));
}

/** "Wednesday, 11 November 2026" (no comma after weekday in en-GB, so add it). */
export function formatLongDate(date: Date): string {
  const parts = longDateFmt.formatToParts(date);
  const weekday = parts.find((p) => p.type === 'weekday')?.value ?? '';
  const rest = parts
    .filter((p) => p.type !== 'weekday')
    .map((p) => p.value)
    .join('')
    .replace(/^[,\s]+/, '');
  return `${weekday}, ${rest}`;
}

/** Group heading for timelines: "Today · Wednesday 11 November". */
export function formatDayGroup(iso: string): string {
  const d = daysAgo(iso);
  const label = groupFmt.format(new Date(iso)).replace(',', '');
  if (d === 0) return `Today · ${label}`;
  if (d === 1) return `Yesterday · ${label}`;
  return label;
}

/** Short relative day used in lists: "14:20" today, "Mon" this week, else "2 Nov". */
export function formatListDate(iso: string): string {
  const d = daysAgo(iso);
  if (d === 0) return formatTime(iso);
  if (d > 0 && d < 7) return weekdayFmt.format(new Date(iso));
  return formatDayMonth(iso);
}

/** "today", "yesterday", "Mon", "3 Nov" */
export function formatRelativeDay(iso: string): string {
  const d = daysAgo(iso);
  if (d === 0) return 'today';
  if (d === 1) return 'yesterday';
  if (d > 1 && d < 7) return weekdayFmt.format(new Date(iso));
  return formatDayMonth(iso);
}

/** "Today 13:58" or "10 Nov 2026" (Sources table "Added"). */
export function formatAdded(iso: string): string {
  return daysAgo(iso) === 0 ? `Today ${formatTime(iso)}` : formatDate(iso);
}

/** "12 min", "2 h", "3 d" */
export function formatAge(iso: string): string {
  const minutes = Math.max(0, Math.round((now().getTime() - Date.parse(iso)) / 60_000));
  if (minutes < 1) return 'now';
  if (minutes < 60) return `${minutes} min`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours} h`;
  return `${Math.round(hours / 24)} d`;
}

/** "updated 2 h ago" style phrase. */
export function formatAgo(iso: string): string {
  const age = formatAge(iso);
  if (age === 'now') return 'just now';
  if (age.endsWith(' d')) return formatRelativeDay(iso);
  return `${age} ago`;
}

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(bytes > 100 * 1024 * 1024 ? 0 : 1)} MB`;
}

export function formatConfidence(value: number | null): string {
  return value === null ? '—' : value.toFixed(2);
}

export function confidenceLabel(value: number): string {
  if (value >= 0.85) return 'high';
  if (value >= 0.6) return 'medium';
  return 'low';
}

/** Greeting by local hour. */
export function greeting(date: Date): string {
  const hour = Number(new Intl.DateTimeFormat('en-GB', { hour: 'numeric', hour12: false, timeZone: DISPLAY_TIME_ZONE }).format(date));
  if (hour < 12) return 'Good morning';
  if (hour < 18) return 'Good afternoon';
  return 'Good evening';
}

export function plural(count: number, one: string, many = `${one}s`): string {
  return `${count} ${count === 1 ? one : many}`;
}

/** "§3.1 Main results" from "3.1 Main results"; "§3.1" when short. */
export function sectionLabel(section: string, short = false): string {
  const match = section.match(/^(\d+(?:\.\d+)*)\s+(.*)$/);
  if (!match) return section;
  return short ? `§${match[1]}` : `§${match[1]} ${match[2]}`;
}
