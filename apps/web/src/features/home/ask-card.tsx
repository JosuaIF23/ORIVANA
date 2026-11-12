import { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router';
import { useMutation } from '@tanstack/react-query';
import { sendMessage } from '@/services/conversations';
import { plural } from '@/lib/format';
import { useProjectsList } from '@/hooks/use-data';
import { Button } from '@/components/ui/button';
import { Input, Select } from '@/components/ui/field';
import { Card } from '@/components/ui/primitives';
import { usePreferences } from '@/features/onboarding/use-onboarding';

/** "Ask your knowledge" — the primary element of Home. */
export function AskCard() {
  const navigate = useNavigate();
  const { data: projects = [] } = useProjectsList();
  const { data: prefs } = usePreferences();
  const [question, setQuestion] = useState('');
  const [projectId, setProjectId] = useState<string | null>(null);
  const selected = projectId ?? prefs?.default_project_id ?? projects[0]?.id ?? '';
  const project = projects.find((p) => p.id === selected);
  const ask = useMutation({
    mutationFn: () => sendMessage(null, { content: question, project_id: selected || null }),
    onSuccess: (res) => navigate(`/assistant/${res.conversation_id}?stream=${res.message_id}`),
  });

  function submit(e: FormEvent) {
    e.preventDefault();
    if (question.trim()) ask.mutate();
  }

  return (
    <Card className="p-6">
      <form onSubmit={submit} aria-labelledby="ask-title">
        <h2 id="ask-title" className="text-lg font-semibold text-fg">
          Ask your knowledge
        </h2>
        <div className="mt-4 flex flex-col gap-3 md:flex-row">
          <label htmlFor="home-question" className="sr-only">
            Question
          </label>
          <Input id="home-question" name="question" autoComplete="off" className="h-12 flex-1 text-base" placeholder="e.g. Which datasets do my RAG papers share?" value={question} onChange={(e) => setQuestion(e.target.value)} />
          <label htmlFor="home-project" className="sr-only">
            Project scope
          </label>
          <Select id="home-project" className="md:w-60 [&_select]:h-12 [&_select]:text-base [&_select]:font-medium" value={selected} onChange={(e) => setProjectId(e.target.value)}>
            <option value="">All of workspace</option>
            {projects.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </Select>
          <Button type="submit" variant="primary" size="lg" className="h-12 px-8" loading={ask.isPending} loadingText="Asking…" disabled={!question.trim()}>
            Ask
          </Button>
        </div>
        <p className="mt-3 text-sm text-fg-secondary">
          Searching: {project ? `Project ${project.name} · ${plural(project.counts.sources, 'source')}` : 'all of your workspace'}. Answers cite the page and section they come from.
        </p>
        {ask.error ? <p role="alert" className="mt-2 text-sm text-danger">{ask.error.message}</p> : null}
      </form>
    </Card>
  );
}
