import type { ReactNode } from 'react';
import { DropdownMenu } from 'radix-ui';
import { cn } from '@/lib/cn';

export interface MenuItem {
  label: string;
  icon?: ReactNode;
  onSelect: () => void;
  tone?: 'default' | 'danger';
  separatorBefore?: boolean;
  disabled?: boolean;
}

/** Keyboard-accessible action menu (Radix). The trigger must be a <button>. */
export function Menu({ trigger, items, align = 'end' }: { trigger: ReactNode; items: MenuItem[]; align?: 'start' | 'end' }) {
  return (
    <DropdownMenu.Root modal={false}>
      <DropdownMenu.Trigger asChild>{trigger}</DropdownMenu.Trigger>
      <DropdownMenu.Portal>
        <DropdownMenu.Content align={align} sideOffset={6} className="z-50 min-w-56 rounded-card border border-subtle bg-elevated p-1">
          {items.map((item) => (
            <div key={item.label}>
              {item.separatorBefore ? <DropdownMenu.Separator className="my-1 h-px bg-subtle" /> : null}
              <DropdownMenu.Item
                disabled={item.disabled}
                onSelect={item.onSelect}
                className={cn(
                  'flex h-9 cursor-pointer items-center gap-3 rounded-control px-3 text-sm outline-none data-[disabled]:cursor-not-allowed data-[disabled]:opacity-50 data-[highlighted]:bg-surface [&_svg]:size-4',
                  item.tone === 'danger' ? 'text-danger' : 'text-fg',
                )}
              >
                {item.icon}
                {item.label}
              </DropdownMenu.Item>
            </div>
          ))}
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  );
}
