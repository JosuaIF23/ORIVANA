import type { ReactNode } from 'react';
import { Dialog as DialogPrimitive } from 'radix-ui';
import { X } from 'lucide-react';
import { cn } from '@/lib/cn';

interface DialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: ReactNode;
  description?: ReactNode;
  icon?: ReactNode;
  children?: ReactNode;
  footer?: ReactNode;
  className?: string;
}

/** Radix dialog: focus trap, Esc to close, focus returns to the trigger. */
export function Dialog({ open, onOpenChange, title, description, icon, children, footer, className }: DialogProps) {
  return (
    <DialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-app/80" />
        <DialogPrimitive.Content
          className={cn(
            'fixed top-1/2 left-1/2 z-50 flex max-h-[calc(100dvh-32px)] w-[calc(100vw-32px)] max-w-xl -translate-x-1/2 -translate-y-1/2 flex-col overflow-hidden rounded-card border border-subtle bg-elevated',
            className,
          )}
        >
          <div className="flex items-start gap-4 p-6 pb-0">
            {icon}
            <div className="min-w-0 flex-1">
              <DialogPrimitive.Title className="text-lg font-semibold text-fg">{title}</DialogPrimitive.Title>
              {description ? <DialogPrimitive.Description className="mt-2 text-sm text-fg-secondary">{description}</DialogPrimitive.Description> : <DialogPrimitive.Description className="sr-only">{title}</DialogPrimitive.Description>}
            </div>
            <DialogPrimitive.Close className="-m-1 rounded-control p-1 text-fg-secondary hover:bg-surface hover:text-fg" aria-label="Close dialog">
              <X className="size-5" aria-hidden="true" />
            </DialogPrimitive.Close>
          </div>
          <div className="min-h-0 overflow-y-auto px-6 py-5">{children}</div>
          {footer ? <div className="flex justify-end gap-3 border-t border-subtle px-6 py-4">{footer}</div> : null}
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}
