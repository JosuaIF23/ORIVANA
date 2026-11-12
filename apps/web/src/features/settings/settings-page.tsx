import { useEffect } from 'react';
import { Link, useParams } from 'react-router';
import { cn } from '@/lib/cn';
import { MemoryControls } from './memory-controls';
import { DataExport } from './data-export';
import { DataDeletion } from './data-deletion';
import { ProfileSection, SecuritySection, ConnectedAppsSection, ModelSection, NotificationsSection, AppearanceSection } from './other-sections';

const SECTIONS = [
  { key: 'profile', label: 'Profile', Component: ProfileSection },
  { key: 'security', label: 'Security & sessions', Component: SecuritySection },
  { key: 'connected-apps', label: 'Connected applications', Component: ConnectedAppsSection },
  { key: 'model', label: 'Model preferences', Component: ModelSection },
  { key: 'memory', label: 'Memory controls', Component: MemoryControls },
  { key: 'export', label: 'Data export', Component: DataExport },
  { key: 'deletion', label: 'Data deletion', Component: DataDeletion },
  { key: 'notifications', label: 'Notifications', Component: NotificationsSection },
  { key: 'appearance', label: 'Appearance', Component: AppearanceSection },
] as const;

/** Settings (UI.md §4.13): section nav + sections; /settings/:section scrolls to one. */
export default function SettingsPage() {
  const { section = 'memory' } = useParams();
  useEffect(() => {
    document.getElementById(`settings-${section}`)?.scrollIntoView({ block: 'start' });
  }, [section]);

  return (
    <div className="grid min-h-[calc(100dvh-var(--topbar-height))] md:grid-cols-[300px_minmax(0,1fr)]">
      <nav aria-label="Settings sections" className="border-b border-subtle px-4 py-6 md:sticky md:top-[var(--topbar-height)] md:h-[calc(100dvh-var(--topbar-height))] md:self-start md:border-r md:border-b-0 md:px-6">
        <h1 className="px-3 text-2xl font-semibold text-fg">Settings</h1>
        <ul className="mt-6 flex gap-1 overflow-x-auto md:flex-col">
          {SECTIONS.map((s) => (
            <li key={s.key} className="shrink-0">
              <Link
                to={`/settings/${s.key}`}
                replace
                aria-current={s.key === section ? 'page' : undefined}
                className={cn('block rounded-control px-3 py-2.5 text-base', s.key === section ? 'bg-elevated font-semibold text-fg' : 'text-fg-secondary hover:bg-elevated/60 hover:text-fg')}
              >
                {s.label}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
      <div className="min-w-0 px-4 py-8 md:px-12">
        <div className="mx-auto flex max-w-[1080px] flex-col gap-16">
          {SECTIONS.map(({ key, label, Component }) => (
            <section key={key} id={`settings-${key}`} aria-labelledby={`settings-${key}-title`} className="scroll-mt-24">
              <h2 id={`settings-${key}-title`} className="text-xl font-semibold text-fg">{label}</h2>
              <Component />
            </section>
          ))}
        </div>
      </div>
    </div>
  );
}
