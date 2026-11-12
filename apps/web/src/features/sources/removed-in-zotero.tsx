import { TriangleAlert } from 'lucide-react';
import type { Source } from '@contracts/types';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/common/toast';
import { useKeepRemovedItem } from '@/features/zotero/use-zotero';

/** "Removed in Zotero" state (UI.md §4.6, PRD §8.2): the user chooses Delete from ORIVANA or Keep. */
export function RemovedInZotero({ source, onDelete }: { source: Source; onDelete: () => void }) {
  const keep = useKeepRemovedItem();
  const toast = useToast();
  return (
    <div className="mt-2 flex flex-wrap items-center gap-3 text-sm">
      <span className="inline-flex items-center gap-1.5 text-warning">
        <TriangleAlert aria-hidden="true" className="size-4" />
        Removed in Zotero
      </span>
      <span className="text-fg-secondary">Keep it in ORIVANA, or delete it here too?</span>
      <Button size="sm" variant="ghost" onClick={() => keep.mutate(source.id, { onSuccess: () => toast.success('Kept in ORIVANA · it no longer syncs'), onError: (e) => toast.error(e.message) })} loading={keep.isPending} loadingText="Keeping…">
        Keep
      </Button>
      <Button size="sm" variant="danger" onClick={onDelete}>
        Delete from ORIVANA
      </Button>
    </div>
  );
}
