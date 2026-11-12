import { Link } from 'react-router';
import { Bell, CircleHelp, LogOut, Search, SlidersHorizontal } from 'lucide-react';
import { useMe, useSignOut } from '@/hooks/use-session';
import { Menu } from '@/components/ui/menu';
import { Kbd } from '@/components/ui/primitives';
import { Logo } from '@/components/common/logo';
import { useNavigate } from 'react-router';

const isMac = typeof navigator !== 'undefined' && /Mac|iPhone|iPad/.test(navigator.platform);

/** Shared top bar: logo, global search trigger (⌘K / Ctrl+K), help, notifications, avatar. */
export function TopBar({ onOpenSearch, onOpenHelp }: { onOpenSearch: () => void; onOpenHelp: () => void }) {
  const { data: me } = useMe();
  const signOut = useSignOut();
  const navigate = useNavigate();
  const unread = me?.counts.unread_notifications ?? 0;
  return (
    <header className="sticky top-0 z-40 flex h-[var(--topbar-height)] items-center gap-4 border-b border-subtle bg-sidebar px-4 md:px-6">
      <Link to="/home" aria-label="ORIVANA home" className="shrink-0 rounded-control">
        <Logo className="[&_svg]:size-7" />
      </Link>
      <button
        type="button"
        onClick={onOpenSearch}
        className="ml-auto hidden h-10 w-full max-w-[560px] items-center gap-3 rounded-control border border-control bg-app px-3 text-left text-sm text-fg-muted hover:border-fg-muted md:ml-[calc(var(--sidebar-width)-170px)] md:flex"
      >
        <Search aria-hidden="true" className="size-4 text-fg-secondary" />
        <span className="flex-1">Search anything…</span>
        <Kbd>{isMac ? '⌘K' : 'Ctrl K'}</Kbd>
      </button>
      <div className="ml-auto flex items-center gap-1 md:gap-2">
        <button type="button" onClick={onOpenSearch} aria-label="Search" className="flex size-10 items-center justify-center rounded-control text-fg-secondary hover:bg-elevated hover:text-fg md:hidden">
          <Search aria-hidden="true" className="size-5" />
        </button>
        <button type="button" onClick={onOpenHelp} aria-label="Help and keyboard shortcuts" className="hidden size-10 items-center justify-center rounded-control text-fg-secondary hover:bg-elevated hover:text-fg md:flex">
          <CircleHelp aria-hidden="true" className="size-5" />
        </button>
        <Link to="/activity" aria-label={unread ? `Notifications, ${unread} unread` : 'Notifications'} className="relative hidden size-10 items-center justify-center rounded-control text-fg-secondary hover:bg-elevated hover:text-fg md:flex">
          <Bell aria-hidden="true" className="size-5" />
          {unread ? <span aria-hidden="true" className="absolute top-2 right-2.5 size-2 rounded-full bg-accent" /> : null}
        </Link>
        <Menu
          trigger={
            <button type="button" aria-label="Account menu" className="ml-1 flex size-10 items-center justify-center rounded-full border border-control bg-surface text-sm font-semibold text-fg hover:border-fg-muted">
              {me?.user.initials ?? ''}
            </button>
          }
          items={[
            { label: 'Settings', icon: <SlidersHorizontal />, onSelect: () => navigate('/settings/profile') },
            { label: 'Sign out', icon: <LogOut />, onSelect: () => signOut.mutate(), separatorBefore: true },
          ]}
        />
      </div>
    </header>
  );
}
