import { useState } from 'react';
import { useNavigate } from 'react-router';
import { FolderPlus } from 'lucide-react';
import { useProjectsList } from '@/hooks/use-data';
import { Button } from '@/components/ui/button';
import { Dialog } from '@/components/ui/dialog';
import { Field, Input, Textarea } from '@/components/ui/field';
import { PageHeader } from '@/components/common/page-header';
import { EmptyState, ErrorState, LoadingSkeleton } from '@/components/common/states';
import { useCreateProject } from '@/features/onboarding/use-onboarding';
import { ProjectCard } from './project-card';

/** Projects list (no design image; uses ProjectCard from Home). */
export default function ProjectsPage() {
  const { data, isPending, error, refetch } = useProjectsList();
  const [creating, setCreating] = useState(false);
  return (
    <div className="mx-auto flex max-w-[1180px] flex-col gap-8">
      <PageHeader
        title="Projects"
        description="Each project keeps its sources, decisions, conversations, and actions together."
        actions={
          <Button variant="primary" size="lg" onClick={() => setCreating(true)}>
            <FolderPlus aria-hidden="true" />
            New project
          </Button>
        }
      />
      {isPending ? (
        <LoadingSkeleton rows={4} label="Loading projects…" />
      ) : error ? (
        <ErrorState error={error} onRetry={() => refetch()} />
      ) : data.length === 0 ? (
        <EmptyState title="No projects yet" description="Create a project to group papers, decisions, and conversations for one outcome." action={<Button variant="primary" onClick={() => setCreating(true)}>New project</Button>} />
      ) : (
        <ul className="grid gap-6 md:grid-cols-2">
          {data.map((p) => (
            <li key={p.id}>
              <ProjectCard project={p} />
            </li>
          ))}
        </ul>
      )}
      <NewProjectDialog open={creating} onOpenChange={setCreating} />
    </div>
  );
}

function NewProjectDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const create = useCreateProject();
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
      title="New project"
      footer={
        <>
          <Button onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button variant="primary" disabled={!name.trim()} loading={create.isPending} loadingText="Creating…" onClick={() => create.mutate({ name, description }, { onSuccess: (p) => navigate(`/projects/${p.id}`) })}>
            Create project
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-4">
        <Field label="Name" error={create.error?.message}>
          {({ id, describedBy, invalid }) => <Input id={id} name="project-name" autoComplete="off" value={name} onChange={(e) => setName(e.target.value)} aria-describedby={describedBy} aria-invalid={invalid} placeholder="e.g. Literature review…" />}
        </Field>
        <Field label="Description" labelSuffix="(optional)">
          {({ id }) => <Textarea id={id} name="project-description" autoComplete="off" value={description} onChange={(e) => setDescription(e.target.value)} />}
        </Field>
      </div>
    </Dialog>
  );
}
