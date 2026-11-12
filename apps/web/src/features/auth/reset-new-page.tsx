import { useState, type FormEvent } from 'react';
import { useNavigate, useSearchParams } from 'react-router';
import { Clock } from 'lucide-react';
import { isApiError } from '@/services/core/http';
import { focusFirstInvalid } from '@/lib/focus';
import { Button, ButtonLink } from '@/components/ui/button';
import { Field } from '@/components/ui/field';
import { AuthCard, AuthLayout } from './auth-layout';
import { PasswordInput, StrengthMeter } from './password-input';
import { useResetPassword } from './use-auth';

export default function ResetNewPage() {
  const [params] = useSearchParams();
  const token = params.get('token') ?? '';
  const navigate = useNavigate();
  const reset = useResetPassword();
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [touched, setTouched] = useState(false);
  const expired = reset.error && isApiError(reset.error) && reset.error.error.code === 'TOKEN_EXPIRED';

  const tooShort = touched && password.length < 12 ? 'Use at least 12 characters.' : null;
  const mismatch = touched && confirm !== password ? 'Passwords don’t match.' : null;

  function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setTouched(true);
    if (password.length < 12 || confirm !== password) {
      focusFirstInvalid(e.currentTarget);
      return;
    }
    reset.mutate({ token, password }, { onSuccess: () => navigate('/home', { replace: true }) });
  }

  if (expired) {
    return (
      <AuthLayout width="max-w-[480px]">
        <AuthCard>
          <div role="alert">
            <Clock aria-hidden="true" className="size-8 text-warning" />
            <h1 className="mt-5 text-2xl font-semibold text-fg">This link has expired</h1>
            <p className="mt-3 text-base text-fg-secondary">Reset links work once and only for 30 minutes. Request a new one — your password hasn’t changed.</p>
          </div>
          <ButtonLink to="/reset-password" size="lg" className="mt-6 w-full">
            Request a new link
          </ButtonLink>
          <hr className="my-6 border-subtle" />
          <p className="text-sm text-fg-secondary">Too many requests? You can ask for 3 links per hour.</p>
        </AuthCard>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout width="max-w-[480px]">
      <AuthCard>
        <h1 className="text-2xl font-semibold text-fg">Choose a new password</h1>
        <form onSubmit={submit} noValidate className="mt-6 flex flex-col gap-5">
          <Field label="New password" error={tooShort}>
            {({ id, describedBy, invalid }) => (
              <div className="flex flex-col gap-3">
                <PasswordInput id={id} autoComplete="new-password" value={password} onChange={(e) => setPassword(e.target.value)} aria-describedby={[describedBy, `${id}-strength`].filter(Boolean).join(' ')} aria-invalid={invalid} />
                <StrengthMeter id={`${id}-strength`} value={password} verbose={false} />
              </div>
            )}
          </Field>
          <Field label="Confirm new password" error={mismatch}>
            {({ id, describedBy, invalid }) => <PasswordInput id={id} autoComplete="new-password" value={confirm} onChange={(e) => setConfirm(e.target.value)} aria-describedby={describedBy} aria-invalid={invalid} />}
          </Field>
          <Button type="submit" variant="primary" size="lg" className="w-full" loading={reset.isPending} loadingText="Saving…">
            Save and sign in
          </Button>
          <p className="text-sm text-fg-secondary">Other active sessions will be signed out.</p>
        </form>
      </AuthCard>
    </AuthLayout>
  );
}
