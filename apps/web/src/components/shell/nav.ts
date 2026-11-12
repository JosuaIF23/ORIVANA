import { Activity, Folder, GitFork, House, MessageSquare, Plug, ShieldCheck, SlidersHorizontal, Upload, type LucideIcon } from 'lucide-react';

/** MVP navigation (UI.md §3). Automations is post-MVP and intentionally absent. */
export interface NavItem {
  to: string;
  label: string;
  icon: LucideIcon;
  /** Paths that also mark this item active. */
  match?: string[];
  badge?: 'pending_approvals';
}

export const PRIMARY_NAV: NavItem[] = [
  { to: '/home', label: 'Home', icon: House },
  { to: '/assistant', label: 'Assistant', icon: MessageSquare },
  { to: '/knowledge/sources', label: 'Knowledge', icon: GitFork, match: ['/knowledge'] },
  { to: '/projects', label: 'Projects', icon: Folder },
  { to: '/approvals', label: 'Approvals', icon: ShieldCheck, badge: 'pending_approvals' },
  { to: '/activity', label: 'Activity', icon: Activity },
  { to: '/integrations', label: 'Integrations', icon: Plug },
];

export const SETTINGS_NAV: NavItem = { to: '/settings/memory', label: 'Settings', icon: SlidersHorizontal, match: ['/settings'] };

/** Mobile bottom navigation (design: Graph · mobile). */
export const MOBILE_NAV: NavItem[] = [
  { to: '/projects', label: 'Projects', icon: Folder },
  { to: '/assistant', label: 'Assistant', icon: MessageSquare },
  { to: '/knowledge/sources?upload=1', label: 'Upload', icon: Upload, match: ['/knowledge'] },
  { to: '/approvals', label: 'Approvals', icon: ShieldCheck, badge: 'pending_approvals' },
  { to: '/activity', label: 'Activity', icon: Activity },
];

export function isActive(item: NavItem, pathname: string): boolean {
  const roots = item.match ?? [item.to.split('?')[0]];
  return roots.some((root) => pathname === root || pathname.startsWith(`${root}/`));
}
