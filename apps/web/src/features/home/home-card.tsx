import type { ReactNode } from 'react';
import { Link } from 'react-router';
import { Card } from '@/components/ui/primitives';

/** Card with a heading and an optional "view more" link, used across Home. */
export function HomeCard({ id, title, link, children }: { id: string; title: ReactNode; link?: { to: string; label: string }; children: ReactNode }) {
  return (
    <Card className="p-6">
      <section aria-labelledby={id}>
        <div className="flex items-baseline justify-between gap-4">
          <h2 id={id} className="text-lg font-semibold text-fg">
            {title}
          </h2>
          {link ? (
            <Link to={link.to} className="shrink-0 rounded-control text-sm text-accent underline underline-offset-4 hover:text-fg">
              {link.label}
            </Link>
          ) : null}
        </div>
        <div className="mt-4">{children}</div>
      </section>
    </Card>
  );
}
