import { Link, useLocation } from 'react-router';
import { cn } from '@/lib/cn';
import { useMe } from '@/hooks/use-session';

const TABS = [
  { to: '/knowledge/sources', label: 'Sources' },
  { to: '/knowledge/graph', label: 'Graph' },
  { to: '/knowledge/memory', label: 'Memory' },
];

/** "Knowledge · Personal workspace" with Sources / Graph / Memory tabs (links). */
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
        <ul className="flex gap-8">
          {TABS.map((tab) => {
            const active = pathname.startsWith(tab.to);
            return (
              <li key={tab.to}>
                <Link
                  to={tab.to}
                  aria-current={active ? 'page' : undefined}
                  className={cn('-mb-px inline-block border-b-2 pb-3 text-base transition-colors', active ? 'border-accent font-medium text-fg' : 'border-transparent text-fg-secondary hover:text-fg')}
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
