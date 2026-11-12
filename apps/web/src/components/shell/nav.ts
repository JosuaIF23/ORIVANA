import { Activity, Folder, GitFork, House, MessageSquare, Plug, ShieldCheck, SlidersHorizontal, type LucideIcon } from 'lucide-react';
import type { MeResponse } from '@contracts/types';

/** MVP navigation (UI.md §3). Automations is post-MVP and intentionally absent. */
export interface NavItem {
  to: string;
  label: string;
  icon: LucideIcon;
  /** Paths that also mark this item active. */
  match?: string[];
  badge?: 'pending_approvals' | 'decisions_needing_review';
}

/** Badge count and its accessible text (UI.md §3.1: "1 decision needs review"). */
export function badgeFor(item: NavItem, me: MeResponse | undefined): { count: number; text: string } {
  if (!item.badge || !me) return { count: 0, text: '' };
  const count = me.counts[item.badge] ?? 0;
  const text = item.badge === 'pending_approvals' ? `${count} pending` : `${count} decision${count === 1 ? ' needs' : 's need'} review`;
  return { count, text };
}

export const PRIMARY_NAV: NavItem[] = [
  { to: '/home', label: 'Home', icon: House, badge: 'decisions_needing_review' },
  { to: '/assistant', label: 'Assistant', icon: MessageSquare },
  { to: '/knowledge/sources', label: 'Knowledge', icon: GitFork, match: ['/knowledge', '/decision-alerts'] },
  { to: '/projects', label: 'Projects', icon: Folder },
  { to: '/approvals', label: 'Approvals', icon: ShieldCheck, badge: 'pending_approvals' },
  { to: '/activity', label: 'Activity', icon: Activity },
  { to: '/integrations', label: 'Integrations', icon: Plug },
];

export const SETTINGS_NAV: NavItem = { to: '/settings/memory', label: 'Settings', icon: SlidersHorizontal, match: ['/settings'] };

/** Mobile bottom navigation (UI.md v2 §7): Home, Assistant, Knowledge, Approvals, More. */
export const MOBILE_NAV: NavItem[] = [
  { to: '/home', label: 'Home', icon: House, badge: 'decisions_needing_review' },
  { to: '/assistant', label: 'Assistant', icon: MessageSquare },
  { to: '/knowledge/sources', label: 'Knowledge', icon: GitFork, match: ['/knowledge', '/decision-alerts'] },
  { to: '/approvals', label: 'Approvals', icon: ShieldCheck, badge: 'pending_approvals' },
];

/** Items under "More" on phones. */
export const MOBILE_MORE: NavItem[] = [
  { to: '/projects', label: 'Projects', icon: Folder },
  { to: '/activity', label: 'Activity', icon: Activity },
  { to: '/integrations', label: 'Integrations', icon: Plug },
  SETTINGS_NAV,
];

export function isActive(item: NavItem, pathname: string): boolean {
  const roots = item.match ?? [item.to.split('?')[0]];
  return roots.some((root) => pathname === root || pathname.startsWith(`${root}/`));
}
