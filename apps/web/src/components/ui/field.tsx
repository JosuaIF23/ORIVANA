import { forwardRef, useId, type InputHTMLAttributes, type ReactNode, type SelectHTMLAttributes, type TextareaHTMLAttributes } from 'react';
import { ChevronDown } from 'lucide-react';
import { cn } from '@/lib/cn';

const control =
  'w-full rounded-control border border-control bg-app text-fg transition-colors hover:border-fg-muted focus-visible:border-accent disabled:cursor-not-allowed disabled:opacity-60 aria-[invalid=true]:border-danger';

export const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(function Input({ className, ...props }, ref) {
  return <input ref={ref} className={cn(control, 'h-10 px-3 text-sm', className)} {...props} />;
});

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaHTMLAttributes<HTMLTextAreaElement>>(function Textarea({ className, ...props }, ref) {
  return <textarea ref={ref} className={cn(control, 'min-h-24 px-3 py-2 text-sm', className)} {...props} />;
});

/** Native select styled with tokens: keyboard and screen-reader behaviour for free. */
export const Select = forwardRef<HTMLSelectElement, SelectHTMLAttributes<HTMLSelectElement>>(function Select({ className, children, ...props }, ref) {
  return (
    <div className={cn('relative', className)}>
      <select ref={ref} className={cn(control, 'h-10 appearance-none pr-9 pl-3 text-sm')} {...props}>
        {children}
      </select>
      <ChevronDown aria-hidden="true" className="pointer-events-none absolute top-1/2 right-3 size-4 -translate-y-1/2 text-fg-secondary" />
    </div>
  );
});

interface FieldProps {
  label: ReactNode;
  /** Optional suffix like "(optional)". */
  labelSuffix?: ReactNode;
  hint?: ReactNode;
  error?: ReactNode;
  /** Right-aligned element on the label row, e.g. "Forgot password?". */
  action?: ReactNode;
  className?: string;
  children: (ids: { id: string; describedBy: string | undefined; invalid: boolean }) => ReactNode;
}

/** Label + control + hint/error with correct aria wiring. */
export function Field({ label, labelSuffix, hint, error, action, className, children }: FieldProps) {
  const id = useId();
  const hintId = `${id}-hint`;
  const errorId = `${id}-error`;
  const describedBy = [error ? errorId : null, hint ? hintId : null].filter(Boolean).join(' ') || undefined;
  return (
    <div className={cn('flex flex-col gap-2', className)}>
      <div className="flex items-baseline justify-between gap-4">
        <label htmlFor={id} className="text-sm font-medium text-fg-secondary">
          {label}
          {labelSuffix ? <span className="font-normal text-fg-muted"> {labelSuffix}</span> : null}
        </label>
        {action}
      </div>
      {children({ id, describedBy, invalid: Boolean(error) })}
      {error ? (
        <p id={errorId} className="text-sm text-danger">
          {error}
        </p>
      ) : null}
      {hint ? (
        <p id={hintId} className="text-xs text-fg-muted">
          {hint}
        </p>
      ) : null}
    </div>
  );
}
