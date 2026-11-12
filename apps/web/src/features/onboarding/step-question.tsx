import { useState, type FormEvent } from 'react';
import { useNavigate, useSearchParams } from 'react-router';
import { Check, MessageSquare } from 'lucide-react';
import { cn } from '@/lib/cn';
import { plural } from '@/lib/format';
import { Button, ButtonLink } from '@/components/ui/button';
import { Textarea } from '@/components/ui/field';
import { CitationChip } from '@/components/common/citation';
import { InlineAlert } from '@/components/common/states';
import { Spinner } from '@/components/ui/spinner';
import { useSource } from '@/features/sources/use-sources';
import { useAskFirstQuestion, usePreferences, useUpdatePreferences } from './use-onboarding';

export function StepQuestion({ onFinish, finishing }: { onFinish: () => void; finishing: boolean }) {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const sourceId = params.get('source');
  const { data: source, isLoading, error: sourceError } = useSource(sourceId);
  const { data: prefs } = usePreferences();
  const ask = useAskFirstQuestion();
  const complete = useUpdatePreferences();
  const suggestions = source?.suggested_questions ?? [];
  const [question, setQuestion] = useState<string | null>(null);
  const text = question ?? suggestions[0] ?? '';

  async function submit(e: FormEvent) {
    e.preventDefault();
    if (!text.trim()) return;
    const res = await ask.mutateAsync({ content: text, projectId: source?.project_id ?? prefs?.default_project_id ?? null });
    await complete.mutateAsync({ onboarding_completed: true });
    navigate(`/assistant/${res.conversation_id}?stream=${res.message_id}`, { replace: true });
  }

  return (
    <form onSubmit={submit}>
      <p className="text-sm font-medium text-fg-secondary">Step 3 of 3</p>
      <h1 className="mt-3 text-2xl font-semibold text-fg">Try a cited question</h1>

      {!sourceId ? (
        <InlineAlert tone="info" className="mt-6" title="No source yet">
          Add a paper first so answers have something to cite. <ButtonLink to="/onboarding/source" variant="link">Add your first paper</ButtonLink>
        </InlineAlert>
      ) : sourceError ? (
        <InlineAlert tone="warning" className="mt-6" title="We couldn’t find that source" live>
          {sourceError.message} <ButtonLink to="/onboarding/source" variant="link">Upload it again</ButtonLink>
        </InlineAlert>
      ) : isLoading || !source ? (
        <p role="status" className="mt-4 flex items-center gap-2 text-fg-secondary">
          <Spinner /> Checking your source…
        </p>
      ) : source.status === 'ready' ? (
        <p role="status" className="mt-4 flex items-center gap-2 text-lg text-fg-secondary">
          <Check aria-hidden="true" className="size-5 text-knowledge" />
          <span>
            <strong className="font-semibold text-fg">{source.title}</strong> is ready — {plural(source.page_count ?? 0, 'page')}, {plural(source.chunk_count ?? 0, 'passage')} indexed.
          </span>
        </p>
      ) : (
        <p role="status" className="mt-4 flex items-center gap-2 text-lg text-fg-secondary">
          <Spinner className="text-accent" />
          <span>
            <strong className="font-semibold text-fg">{source.title}</strong> is still indexing. You can ask now; answers improve when indexing finishes.
          </span>
        </p>
      )}

      {suggestions.length ? (
        <section className="mt-10" aria-labelledby="suggested-title">
          <h2 id="suggested-title" className="text-lg font-semibold text-fg">
            Suggested from your paper
          </h2>
          <ul className="mt-4 flex flex-col gap-3">
            {suggestions.map((s) => (
              <li key={s}>
                <button
                  type="button"
                  onClick={() => setQuestion(s)}
                  aria-pressed={text === s}
                  className={cn('flex w-full items-center gap-4 rounded-card border px-5 py-4 text-left text-base text-fg transition-colors', text === s ? 'border-accent bg-elevated' : 'border-subtle bg-surface hover:border-control')}
                >
                  <MessageSquare aria-hidden="true" className={cn('size-5 shrink-0', text === s ? 'text-accent' : 'text-fg-secondary')} />
                  {s}
                </button>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <div className="mt-8 rounded-card border border-subtle bg-surface p-6">
        <label htmlFor="first-question" className="text-sm font-medium text-fg-secondary">
          Your question
        </label>
        <Textarea id="first-question" name="question" autoComplete="off" className="mt-3 text-lg" rows={2} value={text} onChange={(e) => setQuestion(e.target.value)} placeholder="Ask something your paper can answer…" />
        <div className="mt-4 flex flex-wrap items-center gap-4">
          <p className="flex-1 text-sm text-fg-secondary">
            Answers include numbered citations like <CitationChip ordinal={1} className="mx-1" /> — select one to open the exact page and passage.
          </p>
          <Button type="submit" variant="primary" size="lg" loading={ask.isPending || complete.isPending} loadingText="Asking…" disabled={!text.trim() || !sourceId}>
            Ask
          </Button>
        </div>
        {ask.error ? <p role="alert" className="mt-3 text-sm text-danger">{ask.error.message}</p> : null}
      </div>

      <div className="mt-10 flex items-center justify-between border-t border-subtle pt-8">
        <Button variant="ghost" size="lg" onClick={() => navigate(sourceId ? `/onboarding/source?source=${sourceId}` : '/onboarding/source')}>
          Back
        </Button>
        <Button size="lg" onClick={onFinish} loading={finishing} loadingText="Finishing…">
          Finish and go to Home
        </Button>
      </div>
    </form>
  );
}
