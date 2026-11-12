import { Navigate, useLocation } from 'react-router';

/** Redirects a renamed route and keeps its query string and hash (e.g. /knowledge/graph → /knowledge/map). */
export function RedirectKeepingQuery({ to }: { to: string }) {
  const { search, hash } = useLocation();
  return <Navigate to={`${to}${search}${hash}`} replace />;
}
