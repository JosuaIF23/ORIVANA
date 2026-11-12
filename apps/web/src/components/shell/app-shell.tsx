import { lazy, Suspense, useCallback, useEffect, useState } from 'react';
import { Navigate, Outlet, useLocation, useMatches } from 'react-router';
import { cn } from '@/lib/cn';
import { useMe } from '@/hooks/use-session';
import { isApiError } from '@/services/core/http';
import { ErrorState } from '@/components/common/states';
import { Spinner } from '@/components/ui/spinner';
import { Sidebar } from './sidebar';
import { TopBar } from './top-bar';
import { MobileBottomNav } from './mobile-nav';
import { HelpDialog } from './help-dialog';

const GlobalSearch = lazy(() => import('@/features/search/global-search'));

const COLLAPSE_KEY = 'orivana.sidebar.collapsed';

function readCollapsed(): boolean {
  try {
    return localStorage.getItem(COLLAPSE_KEY) === '1';
  } catch {
    return false;
  }
}

export interface RouteHandle {
  /** Screens with ≥ 3 internal columns use the icon rail (UI.md §2 column budget). */
  rail?: boolean;
  /** Full-bleed content (no page padding). */
  bleed?: boolean;
}

/** Authenticated application shell: TopBar + Sidebar/rail + content + mobile nav. */
export function AppShell() {
  const { data: me, error, isPending, refetch } = useMe();
  const location = useLocation();
  const matches = useMatches();
  const handle = (matches.at(-1)?.handle ?? {}) as RouteHandle;
  const [collapsed, setCollapsed] = useState(readCollapsed);
  const [overlay, setOverlay] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [helpOpen, setHelpOpen] = useState(false);

  useEffect(() => setOverlay(false), [location.pathname]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setSearchOpen(true);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const toggle = useCallback(() => {
    if (handle.rail) {
      setOverlay((v) => !v);
      return;
    }
    setCollapsed((v) => {
      try {
        localStorage.setItem(COLLAPSE_KEY, v ? '0' : '1');
      } catch {
        /* ignore */
      }
      return !v;
    });
  }, [handle.rail]);

  if (isPending) {
    return (
      <div role="status" className="flex h-dvh items-center justify-center gap-3 text-fg-secondary">
        <Spinner /> Loading your workspace…
      </div>
    );
  }
  if (error) {
    if (isApiError(error) && error.status === 401) return <Navigate to="/sign-in" replace state={{ from: location.pathname }} />;
    return <ErrorState className="m-8" error={error} onRetry={() => refetch()} />;
  }
  if (!me.onboarding_completed && !location.pathname.startsWith('/onboarding')) return <Navigate to="/onboarding/welcome" replace />;

  const rail = handle.rail || collapsed;
  return (
    <div className="min-h-dvh bg-app">
      <a href="#main" className="sr-only z-50 rounded-control bg-accent px-4 py-2 text-on-accent focus:not-sr-only focus:fixed focus:top-2 focus:left-2">
        Skip to content
      </a>
      <TopBar onOpenSearch={() => setSearchOpen(true)} onOpenHelp={() => setHelpOpen(true)} />
      <div className="flex">
        <div className={cn('sticky top-[var(--topbar-height)] hidden h-[calc(100dvh-var(--topbar-height))] shrink-0 md:block', overlay && 'z-30')}>
          <Sidebar rail className="xl:hidden" />
          <Sidebar rail={rail} onToggle={toggle} className="hidden xl:flex" />
          {overlay ? <Sidebar rail={false} onToggle={toggle} className="absolute top-0 left-0 z-30 hidden shadow-[8px_0_24px_rgb(0_0_0/0.4)] xl:flex" /> : null}
        </div>
        <main id="main" tabIndex={-1} className={cn('min-w-0 flex-1 pb-20 outline-none md:pb-0', !handle.bleed && 'px-4 py-6 md:px-8 md:py-8 xl:px-12')}>
          <Outlet />
        </main>
      </div>
      <MobileBottomNav />
      {searchOpen ? (
        <Suspense fallback={null}>
          <GlobalSearch open={searchOpen} onOpenChange={setSearchOpen} />
        </Suspense>
      ) : null}
      <HelpDialog open={helpOpen} onOpenChange={setHelpOpen} />
    </div>
  );
}
