import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { ProjectDetail } from '@contracts/types';
import { updateProject } from '@/services/projects';
import { qk } from '@/hooks/query-keys';
import { Button } from '@/components/ui/button';
import { Dialog } from '@/components/ui/dialog';
import { Field, Input, Textarea } from '@/components/ui/field';
import { useToast } from '@/components/common/toast';

export function EditProjectDialog({ project, open, onOpenChange }: { project: ProjectDetail; open: boolean; onOpenChange: (open: boolean) => void }) {
  const queryClient = useQueryClient();
  const toast = useToast();
  const [name, setName] = useState(project.name);
  const [description, setDescription] = useState(project.description);
  const save = useMutation({
    mutationFn: () => updateProject(project.id, { name, description }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: qk.projects });
      onOpenChange(false);
      toast.success('Project saved');
    },
  });
  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
      title="Edit project"
      footer={
        <>
          <Button onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button variant="primary" disabled={!name.trim()} loading={save.isPending} loadingText="Saving…" onClick={() => save.mutate()}>
            Save changes
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-4">
        <Field label="Name" error={save.error?.message}>
          {({ id }) => <Input id={id} name="project-name" autoComplete="off" value={name} onChange={(e) => setName(e.target.value)} />}
        </Field>
        <Field label="Description">
          {({ id }) => <Textarea id={id} name="project-description" autoComplete="off" value={description} onChange={(e) => setDescription(e.target.value)} />}
        </Field>
      </div>
    </Dialog>
  );
}
