import { isRouteErrorResponse, useRouteError } from 'react-router';
import { ButtonLink } from '@/components/ui/button';

/** Last-resort boundary for render errors and failed chunk loads. */
export function RouteError() {
  const error = useRouteError();
  const message = isRouteErrorResponse(error) ? `${error.status} ${error.statusText}` : error instanceof Error ? error.message : 'Unknown error';
  return (
    <main className="mx-auto flex min-h-dvh max-w-lg flex-col items-start justify-center gap-4 px-6">
      <h1 className="text-xl font-semibold text-fg">This screen failed to load</h1>
      <p className="text-base text-fg-secondary">Reload the page. If it keeps happening, the details below help us trace it.</p>
      <pre className="w-full overflow-auto rounded-card border border-subtle bg-surface p-4 font-mono text-xs text-fg-secondary">{message}</pre>
      <ButtonLink to="/home" variant="primary">
        Go to Home
      </ButtonLink>
    </main>
  );
}
