import type { ReactNode } from 'react';
import { Checkbox as CheckboxPrimitive, Switch as SwitchPrimitive } from 'radix-ui';
import { Check } from 'lucide-react';
import { cn } from '@/lib/cn';

interface CheckboxProps {
  id?: string;
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  'aria-describedby'?: string;
  'aria-invalid'?: boolean;
  disabled?: boolean;
  className?: string;
}

export function Checkbox({ className, onCheckedChange, ...props }: CheckboxProps) {
  return (
    <CheckboxPrimitive.Root
      {...props}
      onCheckedChange={(v) => onCheckedChange(v === true)}
      className={cn(
        'flex size-5 shrink-0 items-center justify-center rounded-badge border border-control bg-app transition-colors data-[state=checked]:border-accent data-[state=checked]:bg-accent disabled:opacity-50',
        className,
      )}
    >
      <CheckboxPrimitive.Indicator>
        <Check aria-hidden="true" className="size-3.5 text-on-accent" strokeWidth={3} />
      </CheckboxPrimitive.Indicator>
    </CheckboxPrimitive.Root>
  );
}

interface SwitchProps {
  id?: string;
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  disabled?: boolean;
  'aria-describedby'?: string;
  'aria-label'?: string;
}

export function Switch(props: SwitchProps) {
  return (
    <SwitchPrimitive.Root
      {...props}
      className="relative inline-flex h-6 w-11 shrink-0 items-center rounded-full border border-control bg-elevated transition-colors data-[state=checked]:border-accent data-[state=checked]:bg-accent disabled:opacity-50"
    >
      <SwitchPrimitive.Thumb className="block size-4 translate-x-1 rounded-full bg-fg-secondary transition-transform data-[state=checked]:translate-x-6 data-[state=checked]:bg-on-accent" />
    </SwitchPrimitive.Root>
  );
}

/** Label + description + switch row, with the state also shown as text (UI.md §6). */
export function SwitchRow({ id, label, description, checked, onCheckedChange, disabled }: { id: string; label: ReactNode; description?: ReactNode; checked: boolean; onCheckedChange: (v: boolean) => void; disabled?: boolean }) {
  return (
    <div className="flex items-start justify-between gap-6">
      <div className="min-w-0">
        <label htmlFor={id} className="text-sm font-medium text-fg">
          {label}
        </label>
        {description ? (
          <p id={`${id}-desc`} className="mt-0.5 text-xs text-fg-secondary">
            {description}
          </p>
        ) : null}
      </div>
      <div className="flex shrink-0 items-center gap-3">
        <span className="text-xs text-fg-secondary" aria-hidden="true">
          {checked ? 'On' : 'Off'}
        </span>
        <Switch id={id} checked={checked} onCheckedChange={onCheckedChange} disabled={disabled} aria-describedby={description ? `${id}-desc` : undefined} />
      </div>
    </div>
  );
}
