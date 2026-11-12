import type { Section } from '@contracts/types';
import { cn } from '@/lib/cn';

/** Section navigation with page numbers (document viewer). */
export function SectionOutline({ sections, currentId, onSelect, className }: { sections: Section[]; currentId: string | null; onSelect: (page: number) => void; className?: string }) {
  return (
    <nav aria-label="Sections" className={cn('border-r border-subtle px-4 py-6', className)}>
      <h2 className="px-2 text-sm font-medium text-fg-secondary">Sections</h2>
      {sections.length === 0 ? (
        <p className="mt-3 px-2 text-sm text-fg-muted">No sections yet.</p>
      ) : (
        <ul className="mt-3 flex flex-col gap-0.5">
          {sections.map((s) => (
            <li key={s.id}>
              <button
                type="button"
                onClick={() => onSelect(s.page)}
                aria-current={s.id === currentId ? 'location' : undefined}
                className={cn('flex w-full items-baseline gap-3 rounded-control py-2.5 pr-3 text-left text-base', s.level === 2 ? 'pl-6' : 'pl-2', s.id === currentId ? 'bg-elevated font-semibold text-fg' : 'text-fg-secondary hover:bg-elevated/60 hover:text-fg')}
              >
                <span className="min-w-0 flex-1">{s.number ? `${s.number} ${s.title}` : s.title}</span>
                <span className="text-sm text-fg-muted tabular">{s.page}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </nav>
  );
}
