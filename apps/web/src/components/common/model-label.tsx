import { Cpu } from 'lucide-react';
import { cn } from '@/lib/cn';

/** "Answered with <model>" under every answer (PRD §8.9, UI.md §4.5). */
export function ModelLabel({ name, className }: { name: string | null | undefined; className?: string }) {
  if (!name) return null;
  return (
    <p className={cn('flex items-center gap-1.5 text-xs text-fg-muted', className)}>
      <Cpu aria-hidden="true" className="size-3.5" />
      Answered with <span className="text-fg-secondary">{name}</span>
    </p>
  );
}
