import { useNavigate } from 'react-router';
import { Trash2 } from 'lucide-react';
import type { Source } from '@contracts/types';
import { Button } from '@/components/ui/button';
import { Dialog } from '@/components/ui/dialog';
import { useToast } from '@/components/common/toast';
import { useDeleteSource } from './use-sources';

/** Delete with a clear description of the derived data removed (UI.md §4.7, §6). */
export function DeleteSourceDialog({ source, open, onOpenChange, redirect }: { source: Source; open: boolean; onOpenChange: (open: boolean) => void; redirect?: string }) {
  const del = useDeleteSource();
  const toast = useToast();
  const navigate = useNavigate();
  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
      icon={
        <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-danger/15 text-danger">
          <Trash2 aria-hidden="true" className="size-5" />
        </span>
      }
      title={`Delete “${source.title}”?`}
      description="This can’t be undone. The original file and everything derived from it is removed."
      footer={
        <>
          <Button onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button
            variant="danger-solid"
            loading={del.isPending}
            loadingText="Deleting…"
            onClick={() =>
              del.mutate(source.id, {
                onSuccess: (res) => {
                  onOpenChange(false);
                  toast.success(`Deleted. Removed ${res.removed.chunks} chunks and ${res.removed.citations} citations${res.needs_review.relationships ? `; ${res.needs_review.relationships} relationships need review` : ''}.`);
                  if (redirect) navigate(redirect);
                },
              })
            }
          >
            Delete source
          </Button>
        </>
      }
    >
      <ul className="flex list-disc flex-col gap-2 pl-5 text-base text-fg">
        <li>Extracted text, {source.chunk_count ?? 'all'} chunks, and their embeddings</li>
        <li>Graph evidence that points to this source</li>
        <li>Citations to it in past answers (the answers stay, marked “source deleted”)</li>
      </ul>
      <p className="mt-4 text-sm text-fg-secondary">Relationships and memories left without evidence are flagged for your review. Audit events are kept without content.</p>
      {del.error ? <p role="alert" className="mt-3 text-sm text-danger">{del.error.message}</p> : null}
    </Dialog>
  );
}
