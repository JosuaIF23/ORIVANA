import { Link, useLocation } from 'react-router';
import { ChevronDown, LogOut, PanelLeftClose, PanelLeftOpen } from 'lucide-react';
import { cn } from '@/lib/cn';
import { useMe, useSignOut } from '@/hooks/use-session';
import { Menu } from '@/components/ui/menu';
import { PRIMARY_NAV, SETTINGS_NAV, isActive, type NavItem } from './nav';

interface SidebarProps {
  rail: boolean;
  /** Collapse/expand toggle; hidden when the layout forces the rail without overlay support. */
  onToggle?: () => void;
  className?: string;
}

/** Primary navigation: 240 px expanded or a 64 px icon rail (UI.md §2). */
export function Sidebar({ rail, onToggle, className }: SidebarProps) {
  const { pathname } = useLocation();
  const { data: me } = useMe();
  const pending = me?.counts.pending_approvals ?? 0;
  return (
    <nav aria-label="Primary" className={cn('flex h-full flex-col border-r border-subtle bg-sidebar', rail ? 'w-[var(--rail-width)] items-center px-2 py-4' : 'w-[var(--sidebar-width)] p-4', className)}>
      <WorkspaceSwitcher rail={rail} />
      <ul className={cn('mt-6 flex w-full flex-col gap-1', rail && 'items-center')}>
        {PRIMARY_NAV.map((item) => (
          <li key={item.to} className="w-full">
            <NavLink item={item} rail={rail} active={isActive(item, pathname)} badge={item.badge ? pending : 0} />
          </li>
        ))}
      </ul>
      <div className="mt-auto w-full border-t border-subtle pt-4">
        <NavLink item={SETTINGS_NAV} rail={rail} active={isActive(SETTINGS_NAV, pathname)} badge={0} />
        {onToggle ? (
          <button
            type="button"
            onClick={onToggle}
            aria-label={rail ? 'Expand sidebar' : 'Collapse sidebar to icons'}
            className={cn('mt-1 flex h-10 w-full items-center gap-3 rounded-control px-3 text-fg-secondary hover:bg-elevated hover:text-fg', rail && 'justify-center px-0')}
          >
            {rail ? <PanelLeftOpen aria-hidden="true" className="size-5" /> : <PanelLeftClose aria-hidden="true" className="size-5" />}
            {rail ? null : <span className="text-sm">Collapse</span>}
          </button>
        ) : null}
      </div>
    </nav>
  );
}

function NavLink({ item, rail, active, badge }: { item: NavItem; rail: boolean; active: boolean; badge: number }) {
  const Icon = item.icon;
  return (
    <Link
      to={item.to}
      aria-current={active ? 'page' : undefined}
      aria-label={rail ? (badge ? `${item.label}, ${badge} pending` : item.label) : undefined}
      title={rail ? item.label : undefined}
      className={cn(
        'relative flex h-10 items-center gap-3 rounded-control text-base transition-colors',
        rail ? 'mx-auto w-11 justify-center' : 'w-full px-3',
        active ? 'bg-elevated font-semibold text-fg' : 'text-fg-secondary hover:bg-elevated/60 hover:text-fg',
      )}
    >
      <Icon aria-hidden="true" className={cn('size-5 shrink-0', active && 'text-accent')} />
      {rail ? null : <span className="flex-1 truncate">{item.label}</span>}
      {badge > 0 ? (
        <span
          aria-hidden={rail ? true : undefined}
          className={cn('flex h-5 min-w-5 items-center justify-center rounded-full bg-elevated px-1.5 text-xs font-semibold text-fg ring-1 ring-subtle tabular', rail && 'absolute -top-1 -right-1')}
        >
          {badge}
          {rail ? null : <span className="sr-only"> pending</span>}
        </span>
      ) : null}
    </Link>
  );
}

function WorkspaceSwitcher({ rail }: { rail: boolean }) {
  const { data: me } = useMe();
  const signOut = useSignOut();
  const initials = me?.user.initials ?? '··';
  const trigger = (
    <button
      type="button"
      aria-label={`Workspace: ${me?.workspace.name ?? 'loading'}. Open workspace menu`}
      className={cn('flex items-center gap-3 rounded-card border border-subtle bg-surface text-left hover:border-control', rail ? 'size-11 justify-center p-0' : 'h-14 w-full px-3')}
    >
      <span className="flex size-8 shrink-0 items-center justify-center rounded-control bg-accent text-sm font-semibold text-on-accent">{initials}</span>
      {rail ? null : (
        <>
          <span className="min-w-0 flex-1">
            <span className="block truncate text-sm font-semibold text-fg">{me?.workspace.name ?? 'Loading…'}</span>
            <span className="block text-xs text-fg-secondary capitalize">{me?.role ?? ''}</span>
          </span>
          <ChevronDown aria-hidden="true" className="size-4 text-fg-secondary" />
        </>
      )}
    </button>
  );
  return (
    <Menu
      align="start"
      trigger={trigger}
      items={[
        { label: me?.workspace.name ?? 'Personal workspace', onSelect: () => undefined, disabled: true },
        { label: 'Sign out', icon: <LogOut />, onSelect: () => signOut.mutate(), separatorBefore: true },
      ]}
    />
  );
}

export { Link };
