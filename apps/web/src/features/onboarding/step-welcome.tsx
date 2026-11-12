import { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router';
import type { Preferences } from '@contracts/types';
import { cn } from '@/lib/cn';
import { suggestedProjectName } from '@/services/demo';
import { Button } from '@/components/ui/button';
import { Field, Input } from '@/components/ui/field';
import { useCreateProject, useUpdatePreferences } from './use-onboarding';

/** Product options for the use-case question (UI.md §4.3: research first, others later). */
const USE_CASES: Array<{ value: Preferences['use_case']; title: string; description: string; available: boolean }> = [
  { value: 'research', title: 'Research', description: 'Compare papers, trace methods and datasets, keep project decisions with their evidence.', available: true },
  { value: 'software_development', title: 'Software development', description: 'Connect docs, issues, and incident notes.', available: false },
  { value: 'knowledge_work', title: 'Knowledge work & consulting', description: 'Briefs, project records, and follow-ups.', available: false },
];

export function StepWelcome({ firstName }: { firstName: string | null }) {
  const navigate = useNavigate();
  const [useCase, setUseCase] = useState<Preferences['use_case']>('research');
  const [projectName, setProjectName] = useState(suggestedProjectName);
  const updatePrefs = useUpdatePreferences();
  const createProject = useCreateProject();
  const busy = updatePrefs.isPending || createProject.isPending;

  async function submit(e: FormEvent) {
    e.preventDefault();
    await updatePrefs.mutateAsync({ use_case: useCase });
    if (projectName.trim()) await createProject.mutateAsync({ name: projectName.trim() });
    navigate('/onboarding/source');
  }

  return (
    <form onSubmit={submit}>
      <p className="text-sm font-medium text-fg-secondary">Step 1 of 3</p>
      <h1 className="mt-3 text-2xl font-semibold text-fg">{firstName ? `Welcome, ${firstName}` : 'Welcome'}</h1>
      <p className="mt-3 max-w-[70ch] text-lg text-fg-secondary">ORIVANA connects your papers and notes, answers with page-level citations, and prepares actions that run only after you approve them.</p>

      <fieldset className="mt-10">
        <legend className="text-base font-semibold text-fg">What will you use ORIVANA for?</legend>
        <div className="mt-4 flex flex-col gap-3">
          {USE_CASES.map((option) => (
            <label
              key={option.value}
              className={cn(
                'flex gap-4 rounded-card border p-5 transition-colors has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-accent',
                useCase === option.value ? 'border-accent bg-elevated' : 'border-subtle bg-surface',
                option.available ? 'cursor-pointer hover:border-control' : 'cursor-not-allowed',
              )}
            >
              <input
                type="radio"
                name="use-case"
                value={option.value}
                checked={useCase === option.value}
                disabled={!option.available}
                onChange={() => setUseCase(option.value)}
                className="mt-1 size-5 shrink-0 accent-[var(--accent-primary)] disabled:opacity-50"
              />
              <span className="min-w-0 flex-1">
                <span className={cn('block text-lg font-semibold', option.available ? 'text-fg' : 'text-fg-secondary')}>{option.title}</span>
                <span className="mt-1 block text-base text-fg-secondary">{option.description}</span>
              </span>
              <span className={cn('text-sm', option.available ? 'font-semibold text-accent' : 'text-fg-secondary')}>{option.available ? 'Recommended' : 'Coming later'}</span>
            </label>
          ))}
        </div>
      </fieldset>

      <Field className="mt-10" label="Name your first project" labelSuffix="(optional)" hint="Projects keep sources, decisions, and conversations together. You can create more later.">
        {({ id, describedBy }) => <Input id={id} value={projectName} onChange={(e) => setProjectName(e.target.value)} aria-describedby={describedBy} autoComplete="off" />}
      </Field>

      {updatePrefs.error || createProject.error ? <p role="alert" className="mt-4 text-sm text-danger">{(updatePrefs.error ?? createProject.error)?.message}</p> : null}

      <div className="mt-10 flex items-center justify-end gap-4 border-t border-subtle pt-8">
        <Button variant="ghost" size="lg" onClick={() => navigate('/onboarding/source')} disabled={busy}>
          Skip for now
        </Button>
        <Button type="submit" variant="primary" size="lg" loading={busy} loadingText="Saving…">
          Continue to upload
        </Button>
      </div>
    </form>
  );
}
