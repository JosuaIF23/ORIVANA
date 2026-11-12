import { Dialog } from '@/components/ui/dialog';
import { Kbd } from '@/components/ui/primitives';

const SHORTCUTS: Array<[string, string]> = [
  ['Ctrl / ⌘ + K', 'Open search'],
  ['↑ ↓', 'Move through search results'],
  ['Enter', 'Open the selected result · send a message'],
  ['Shift + Enter', 'New line in the composer'],
  ['Esc', 'Close a dialog or menu'],
];

export function HelpDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange} title="Help" description="Keyboard shortcuts work everywhere in ORIVANA.">
      <dl className="grid gap-3 text-sm">
        {SHORTCUTS.map(([keys, label]) => (
          <div key={keys} className="flex items-center justify-between gap-4">
            <dt className="text-fg-secondary">{label}</dt>
            <dd>
              <Kbd>{keys}</Kbd>
            </dd>
          </div>
        ))}
      </dl>
    </Dialog>
  );
}
