import { Link, useLocation } from 'react-router';
import { cn } from '@/lib/cn';
import { useMe } from '@/hooks/use-session';

/** Knowledge tabs (UI.md v2 §3.2): Sources · Matrix · Claims · Map · Memory. */
const TABS = [
  { to: '/knowledge/sources', label: 'Sources' },
  { to: '/knowledge/matrix', label: 'Matrix' },
  { to: '/knowledge/claims', label: 'Claims' },
  { to: '/knowledge/map', label: 'Map' },
  { to: '/knowledge/memory', label: 'Memory' },
];

/** "Knowledge · Personal workspace" with the five Knowledge tabs (links). */
export function KnowledgeHeader({ className }: { className?: string }) {
  const { pathname } = useLocation();
  const { data: me } = useMe();
  return (
    <header className={cn('border-b border-subtle px-4 pt-6 md:px-10', className)}>
      <div className="flex items-baseline gap-4">
        <h1 className="text-xl font-semibold text-fg">Knowledge</h1>
        <span className="text-sm text-fg-secondary">{me?.workspace.name}</span>
      </div>
      <nav aria-label="Knowledge sections" className="mt-4">
        <ul className="flex gap-6 max-md:overflow-x-auto max-md:overflow-y-hidden md:gap-8">
          {TABS.map((tab) => {
            const active = pathname.startsWith(tab.to);
            return (
              <li key={tab.to}>
                <Link
                  to={tab.to}
                  aria-current={active ? 'page' : undefined}
                  className={cn('-mb-px inline-block border-b-2 pb-3 text-base whitespace-nowrap transition-colors', active ? 'border-accent font-medium text-fg' : 'border-transparent text-fg-secondary hover:text-fg')}
                >
                  {tab.label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </header>
  );
}
