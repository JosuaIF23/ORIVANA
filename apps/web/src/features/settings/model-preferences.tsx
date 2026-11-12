import { useId } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Lock } from 'lucide-react';
import { getModels } from '@/services/models';
import { qk } from '@/hooks/query-keys';
import { cn } from '@/lib/cn';
import { ErrorState, LoadingSkeleton } from '@/components/common/states';
import { useToast } from '@/components/common/toast';
import { usePreferences, useUpdatePreferences } from '@/features/onboarding/use-onboarding';

const TASK: Record<string, string> = { extraction: 'Extraction', embeddings: 'Embeddings', decision_impact: 'Decision Impact checks' };

/** Settings → Model preferences (UI.md §4.16, PRD §8.9): ModelPicker plus system-managed models and providers. */
export function ModelPreferences() {
  const models = useQuery({ queryKey: qk.models, queryFn: getModels });
  const prefs = usePreferences();
  const update = useUpdatePreferences();
  const toast = useToast();
  const name = useId();
  if (models.isPending || prefs.isPending) return <LoadingSkeleton className="mt-6" rows={4} label="Loading models…" />;
  if (models.error || prefs.error) return <ErrorState className="mt-6" error={models.error ?? prefs.error} onRetry={() => models.refetch()} />;
  const current = prefs.data.answer_model ?? models.data.answer_models.find((m) => m.is_default)?.id;
  const pendingId = update.isPending ? update.variables?.answer_model : null;

  function choose(id: string, label: string) {
    update.mutate({ answer_model: id }, { onSuccess: () => toast.success(`New answers will use ${label}`), onError: (e) => toast.error(e.message) });
  }

  return (
    <div className="mt-6 flex flex-col gap-8">
      <fieldset>
        <legend className="text-base font-medium text-fg">Answer model</legend>
        <p className="mt-1 text-sm text-fg-secondary">Changing the model affects new answers only. Each answer shows the model that wrote it.</p>
        <div className="mt-4 grid gap-3 md:grid-cols-2">
          {models.data.answer_models.map((m) => {
            const checked = (pendingId ?? current) === m.id;
            return (
              <label key={m.id} className={cn('flex cursor-pointer items-start gap-3 rounded-card border p-4 transition-colors', checked ? 'border-accent bg-accent/5' : 'border-subtle bg-surface hover:border-control')}>
                <input type="radio" name={name} value={m.id} checked={checked} disabled={update.isPending} onChange={() => choose(m.id, m.name)} className="mt-1 accent-accent" />
                <span className="min-w-0">
                  <span className="flex flex-wrap items-center gap-2 text-base font-medium text-fg">
                    <span translate="no">{m.name}</span>
                    <span className="rounded-badge border border-control px-1.5 text-xs font-normal text-fg-secondary">{m.tier === 'fast' ? 'Fast' : 'Strong'}</span>
                    {m.is_default ? <span className="text-xs font-normal text-fg-muted">Default</span> : null}
                    {pendingId === m.id ? <span className="text-xs font-normal text-accent">Saving…</span> : null}
                  </span>
                  <span className="mt-1 block text-sm text-fg-secondary">{m.provider} · {m.description}</span>
                </span>
              </label>
            );
          })}
        </div>
      </fieldset>
      <section aria-labelledby="managed-models">
        <h3 id="managed-models" className="flex items-center gap-2 text-base font-medium text-fg">
          <Lock aria-hidden="true" className="size-4 text-fg-secondary" />
          Managed by ORIVANA
        </h3>
        <p className="mt-1 text-sm text-fg-secondary">Extraction and embeddings are managed by ORIVANA to keep your knowledge consistent.</p>
        <ul className="mt-3 divide-y divide-subtle rounded-card border border-subtle">
          {models.data.managed.map((m) => (
            <li key={m.task} className="flex flex-wrap justify-between gap-3 px-5 py-3 text-sm">
              <span className="text-fg">{TASK[m.task]}</span>
              <span className="text-fg-secondary">{m.name} · {m.provider}</span>
            </li>
          ))}
        </ul>
      </section>
      <section aria-labelledby="providers">
        <h3 id="providers" className="text-base font-medium text-fg">AI providers that may process your data</h3>
        <ul className="mt-3 flex flex-col gap-2 text-sm">
          {models.data.providers.map((p) => (
            <li key={p.name} className="text-fg-secondary">
              <span className="text-fg">{p.name}</span> — {p.purpose}
            </li>
          ))}
        </ul>
        <p className="mt-3 text-sm text-fg-muted">Only the passages a task needs are sent. Keys stay on ORIVANA’s servers and are never shown in the browser.</p>
      </section>
    </div>
  );
}
