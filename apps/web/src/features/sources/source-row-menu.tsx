import { useNavigate } from 'react-router';
import { FileText, MoreHorizontal, RotateCw, Trash2 } from 'lucide-react';
import type { Source } from '@contracts/types';
import { Menu } from '@/components/ui/menu';

export function SourceRowMenu({ source, onDelete, onReprocess }: { source: Source; onDelete: () => void; onReprocess: () => void }) {
  const navigate = useNavigate();
  const processing = ['queued', 'parsing', 'indexing'].includes(source.status);
  return (
    <Menu
      trigger={
        <button type="button" aria-label={`Actions for ${source.title}`} className="inline-flex size-9 items-center justify-center rounded-control text-fg-secondary hover:bg-elevated hover:text-fg">
          <MoreHorizontal aria-hidden="true" className="size-5" />
        </button>
      }
      items={[
        { label: 'Open', icon: <FileText />, onSelect: () => navigate(`/knowledge/sources/${source.id}`) },
        { label: 'Reprocess', icon: <RotateCw />, onSelect: onReprocess, disabled: processing },
        { label: 'Delete source…', icon: <Trash2 />, onSelect: onDelete, tone: 'danger', separatorBefore: true },
      ]}
    />
  );
}
