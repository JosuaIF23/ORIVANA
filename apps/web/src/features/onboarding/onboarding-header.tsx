import { Fragment } from 'react';
import { Check } from 'lucide-react';
import { cn } from '@/lib/cn';
import { Logo } from '@/components/common/logo';

export const STEPS = [
  { key: 'welcome', label: 'Welcome' },
  { key: 'source', label: 'First source' },
  { key: 'question', label: 'First question' },
] as const;

export type StepKey = (typeof STEPS)[number]['key'];

export function OnboardingHeader({ current, onSkip, skipping }: { current: StepKey; onSkip: () => void; skipping: boolean }) {
  const index = STEPS.findIndex((s) => s.key === current);
  return (
    <header className="flex flex-wrap items-center gap-4 border-b border-subtle px-4 py-4 md:px-8">
      <Logo />
      <ol aria-label="Setup progress" className="order-3 flex w-full items-center justify-center gap-3 md:order-none md:w-auto md:flex-1">
        {STEPS.map((s, i) => (
          <Fragment key={s.key}>
            {i > 0 ? <li aria-hidden="true" className="hidden h-px w-12 bg-control sm:block" /> : null}
            <li aria-current={i === index ? 'step' : undefined} className="flex items-center gap-2 text-sm">
              <span
                className={cn(
                  'flex size-7 items-center justify-center rounded-full border text-sm',
                  i < index && 'border-knowledge/40 bg-knowledge/10 text-knowledge',
                  i === index && 'border-accent bg-accent font-semibold text-on-accent',
                  i > index && 'border-control text-fg-secondary',
                )}
              >
                {i < index ? <Check aria-hidden="true" className="size-4" /> : i + 1}
                {i < index ? <span className="sr-only">Done:</span> : null}
              </span>
              <span className={cn('hidden sm:inline', i === index ? 'font-semibold text-fg' : 'text-fg-secondary')}>{s.label}</span>
            </li>
          </Fragment>
        ))}
      </ol>
      <button type="button" onClick={onSkip} disabled={skipping} className="ml-auto rounded-control text-base text-fg-secondary underline underline-offset-4 hover:text-fg md:ml-0">
        Skip setup
      </button>
    </header>
  );
}
