import { forwardRef, useState, type InputHTMLAttributes } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { cn } from '@/lib/cn';
import { Input } from '@/components/ui/field';

/** Password field with a show/hide toggle (a real <button>). */
export const PasswordInput = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(function PasswordInput({ className, ...props }, ref) {
  const [visible, setVisible] = useState(false);
  return (
    <div className="relative">
      <Input ref={ref} type={visible ? 'text' : 'password'} className={cn('pr-11', className)} {...props} />
      <button
        type="button"
        onClick={() => setVisible((v) => !v)}
        aria-label={visible ? 'Hide password' : 'Show password'}
        aria-pressed={visible}
        className="absolute top-1/2 right-1.5 flex size-8 -translate-y-1/2 items-center justify-center rounded-control text-fg-secondary hover:text-fg"
      >
        {visible ? <EyeOff aria-hidden="true" className="size-4" /> : <Eye aria-hidden="true" className="size-4" />}
      </button>
    </div>
  );
});

export interface Strength {
  score: 0 | 1 | 2 | 3 | 4;
  label: string;
}

/** Simple length + variety heuristic; the server enforces ≥ 12 characters. */
export function passwordStrength(value: string): Strength {
  if (!value) return { score: 0, label: '' };
  const variety = [/[a-z]/, /[A-Z]/, /\d/, /[^A-Za-z0-9]/, /\s/].filter((r) => r.test(value)).length;
  if (value.length < 8) return { score: 1, label: 'Weak' };
  if (value.length < 12) return { score: 2, label: 'Fair' };
  if (value.length >= 20 && variety >= 3) return { score: 4, label: 'Very strong' };
  return { score: 3, label: 'Strong' };
}

const TONE = ['bg-elevated', 'bg-danger', 'bg-warning', 'bg-knowledge', 'bg-knowledge'];
const TEXT = ['', 'text-danger', 'text-warning', 'text-knowledge', 'text-knowledge'];

export function StrengthMeter({ value, id, verbose = true }: { value: string; id?: string; verbose?: boolean }) {
  const strength = passwordStrength(value);
  return (
    <div id={id} className="flex flex-col gap-2" aria-live="polite">
      <div className="grid grid-cols-4 gap-1.5" aria-hidden="true">
        {[1, 2, 3, 4].map((i) => (
          <span key={i} className={cn('h-1 rounded-full', i <= strength.score ? TONE[strength.score] : 'bg-elevated')} />
        ))}
      </div>
      <p className="text-xs text-fg-secondary">
        {strength.label ? <span className={cn('font-semibold', TEXT[strength.score])}>{strength.label}</span> : null}
        {strength.label ? ' · at least 12 characters.' : 'At least 12 characters.'}{verbose ? ' A passphrase of 3–4 words works well.' : ''}
      </p>
    </div>
  );
}
