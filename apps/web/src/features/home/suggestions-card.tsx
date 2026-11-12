import { Link } from 'react-router';
import { ArrowRight } from 'lucide-react';
import type { Suggestion } from '@contracts/types';
import { useSuggestions } from '@/hooks/use-data';
import { Card } from '@/components/ui/primitives';
import { LoadingSkeleton } from '@/components/common/states';

function hrefFor(s: Suggestion): string {
  if (s.target.kind === 'graph_candidates') return '/knowledge/map?view=list&candidates=1';
  if (s.target.kind === 'memory_review') return '/knowledge/memory';
  return '/knowledge/sources?status=failed';
}

/** Suggested next steps, derived only from explicit activity (UI.md §4.4). */
export function SuggestionsCard() {
  const { data, isPending } = useSuggestions();
  if (!isPending && !data?.items.length) return null;
  return (
    <Card className="p-6">
      <section aria-labelledby="next-steps">
        <h2 id="next-steps" className="text-lg font-semibold text-fg">
          Suggested next steps
        </h2>
        {isPending ? (
          <LoadingSkeleton rows={2} className="mt-4" />
        ) : (
          <>
            <p className="mt-1 text-sm text-fg-secondary">{data.basis}</p>
            <ul className="mt-3">
              {data.items.map((s) => (
                <li key={s.id}>
                  <Link to={hrefFor(s)} className="flex items-center justify-between gap-4 rounded-control px-3 py-3 text-base text-fg hover:bg-elevated">
                    {s.text}
                    <ArrowRight aria-hidden="true" className="size-4 shrink-0 text-fg-secondary" />
                  </Link>
                </li>
              ))}
            </ul>
          </>
        )}
      </section>
    </Card>
  );
}
