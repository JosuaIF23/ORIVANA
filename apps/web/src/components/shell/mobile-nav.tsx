import { Link, useLocation, useNavigate } from 'react-router';
import { Ellipsis } from 'lucide-react';
import { cn } from '@/lib/cn';
import { useMe } from '@/hooks/use-session';
import { Menu } from '@/components/ui/menu';
import { MOBILE_MORE, MOBILE_NAV, badgeFor, isActive } from './nav';

const ITEM = 'flex h-16 w-full flex-col items-center justify-center gap-1 text-xs';

/** Bottom navigation on phones (< 768 px), UI.md v2 §7: Home, Assistant, Knowledge, Approvals, More. */
export function MobileBottomNav() {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const { data: me } = useMe();
  const moreActive = MOBILE_MORE.some((item) => isActive(item, pathname));
  return (
    <nav aria-label="Primary" className="fixed inset-x-0 bottom-0 z-40 border-t border-subtle bg-sidebar pb-[env(safe-area-inset-bottom)] md:hidden">
      <ul className="grid grid-cols-5">
        {MOBILE_NAV.map((item) => {
          const Icon = item.icon;
          const active = isActive(item, pathname);
          const badge = badgeFor(item, me);
          return (
            <li key={item.label}>
              <Link to={item.to} aria-current={active ? 'page' : undefined} className={cn(ITEM, active ? 'text-fg' : 'text-fg-secondary')}>
                <span className="relative">
                  <Icon aria-hidden="true" className={cn('size-6', active && 'text-accent')} />
                  {badge.count ? (
                    <span
                      className={cn(
                        'absolute -top-2 -right-3 flex h-5 min-w-5 items-center justify-center rounded-full px-1 text-xs font-semibold ring-1',
                        item.badge === 'decisions_needing_review' ? 'bg-warning/15 text-warning ring-warning/50' : 'bg-elevated text-fg ring-subtle',
                      )}
                    >
                      <span aria-hidden="true">{badge.count}</span>
                      <span className="sr-only">{badge.text}</span>
                    </span>
                  ) : null}
                </span>
                {item.label}
              </Link>
            </li>
          );
        })}
        <li>
          <Menu
            align="end"
            trigger={
              <button type="button" aria-current={moreActive ? 'page' : undefined} className={cn(ITEM, moreActive ? 'text-fg' : 'text-fg-secondary')}>
                <Ellipsis aria-hidden="true" className={cn('size-6', moreActive && 'text-accent')} />
                More
              </button>
            }
            items={MOBILE_MORE.map((item) => {
              const Icon = item.icon;
              return { label: item.label, icon: <Icon />, onSelect: () => navigate(item.to) };
            })}
          />
        </li>
      </ul>
    </nav>
  );
}
