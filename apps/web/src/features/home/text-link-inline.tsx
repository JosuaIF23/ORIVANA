import type { ReactNode } from 'react';
import { Link } from 'react-router';

export function TextLinkInline({ to, children }: { to: string; children: ReactNode }) {
  return (
    <Link to={to} className="text-accent underline underline-offset-4 hover:text-fg">
      {children}
    </Link>
  );
}
