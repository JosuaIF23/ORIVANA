import { Link, useLocation } from 'react-router';
import { cn } from '@/lib/cn';
import { useMe } from '@/hooks/use-session';
import { MOBILE_NAV, isActive } from './nav';

/** Bottom navigation on phones (< 768 px), UI.md §7. */
export function MobileBottomNav() {
  const { pathname } = useLocation();
  const { data: me } = useMe();
  const pending = me?.counts.pending_approvals ?? 0;
  return (
    <nav aria-label="Primary" className="fixed inset-x-0 bottom-0 z-40 border-t border-subtle bg-sidebar pb-[env(safe-area-inset-bottom)] md:hidden">
      <ul className="grid grid-cols-5">
        {MOBILE_NAV.map((item) => {
          const Icon = item.icon;
          const active = item.label !== 'Upload' && isActive(item, pathname);
          const count = item.badge ? pending : 0;
          return (
            <li key={item.label}>
              <Link
                to={item.to}
                aria-current={active ? 'page' : undefined}
                className={cn('flex h-16 flex-col items-center justify-center gap-1 text-xs', active ? 'text-fg' : 'text-fg-secondary')}
              >
                <span className="relative">
                  <Icon aria-hidden="true" className={cn('size-6', active && 'text-accent')} />
                  {count ? (
                    <span className="absolute -top-2 -right-3 flex h-5 min-w-5 items-center justify-center rounded-full bg-elevated px-1 text-xs font-semibold text-fg ring-1 ring-subtle">
                      {count}
                      <span className="sr-only"> pending</span>
                    </span>
                  ) : null}
                </span>
                {item.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
