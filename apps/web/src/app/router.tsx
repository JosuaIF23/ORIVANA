import { createBrowserRouter, Navigate, Outlet, ScrollRestoration } from 'react-router';
import { AppShell, type RouteHandle } from '@/components/shell/app-shell';
import { RouteError } from './route-error';
import { RedirectKeepingQuery } from './redirect';

type Loader = () => Promise<{ default: React.ComponentType }>;

/** Code-split every screen: each route loads its own chunk. */
function page(load: Loader) {
  return async () => ({ Component: (await load()).default });
}

const rail: RouteHandle = { rail: true, bleed: true };
const bleed: RouteHandle = { bleed: true };

export const router = createBrowserRouter([
  {
    element: (
      <>
        <ScrollRestoration />
        <Outlet />
      </>
    ),
    errorElement: <RouteError />,
    hydrateFallbackElement: <div role="status" className="sr-only">Loading ORIVANA…</div>,
    children: [
      { path: '/sign-in', lazy: page(() => import('@/features/auth/sign-in-page')) },
      { path: '/sign-up', lazy: page(() => import('@/features/auth/sign-up-page')) },
      { path: '/check-email', lazy: page(() => import('@/features/auth/check-email-page')) },
      { path: '/verify-email', lazy: page(() => import('@/features/auth/verify-email-page')) },
      { path: '/reset-password', lazy: page(() => import('@/features/auth/reset-request-page')) },
      { path: '/reset-password/sent', lazy: page(() => import('@/features/auth/reset-sent-page')) },
      { path: '/reset-password/new', lazy: page(() => import('@/features/auth/reset-new-page')) },
      { path: '/onboarding/:step', lazy: page(() => import('@/features/onboarding/onboarding-page')) },
      {
        element: <AppShell />,
        children: [
          { index: true, element: <Navigate to="/home" replace /> },
          { path: '/home', lazy: page(() => import('@/features/home/home-page')) },
          { path: '/assistant', lazy: page(() => import('@/features/assistant/assistant-page')), handle: rail },
          { path: '/assistant/:conversationId', lazy: page(() => import('@/features/assistant/assistant-page')), handle: rail },
          { path: '/knowledge', element: <Navigate to="/knowledge/sources" replace /> },
          { path: '/knowledge/sources', lazy: page(() => import('@/features/sources/sources-page')), handle: bleed },
          { path: '/knowledge/sources/:sourceId', lazy: page(() => import('@/features/sources/document-viewer-page')), handle: rail },
          { path: '/knowledge/matrix', lazy: page(() => import('@/features/matrix/matrix-page')), handle: rail },
          { path: '/knowledge/claims', lazy: page(() => import('@/features/claims/claims-page')), handle: rail },
          { path: '/knowledge/map', lazy: page(() => import('@/features/graph/graph-page')), handle: rail },
          { path: '/knowledge/graph', element: <RedirectKeepingQuery to="/knowledge/map" /> },
          { path: '/knowledge/memory', lazy: page(() => import('@/features/memory/memory-page')), handle: bleed },
          { path: '/projects', lazy: page(() => import('@/features/projects/projects-page')) },
          { path: '/projects/:projectId/:tab?', lazy: page(() => import('@/features/projects/project-page')) },
          { path: '/approvals', lazy: page(() => import('@/features/approvals/approvals-page')), handle: bleed },
          { path: '/approvals/:proposalId', lazy: page(() => import('@/features/approvals/approvals-page')), handle: bleed },
          { path: '/approvals/:proposalId/edit', lazy: page(() => import('@/features/approvals/approvals-page')), handle: bleed },
          { path: '/activity', lazy: page(() => import('@/features/activity/activity-page')) },
          { path: '/integrations', lazy: page(() => import('@/features/integrations/integrations-page')) },
          { path: '/settings', element: <Navigate to="/settings/memory" replace /> },
          { path: '/settings/:section', lazy: page(() => import('@/features/settings/settings-page')), handle: bleed },
          { path: '/search', lazy: page(() => import('@/features/search/search-page')) },
          { path: '*', lazy: page(() => import('./not-found-page')) },
        ],
      },
    ],
  },
]);
