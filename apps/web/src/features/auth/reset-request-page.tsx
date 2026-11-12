import { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router';
import { isApiError } from '@/services/core/http';
import { focusFirstInvalid } from '@/lib/focus';
import { Button } from '@/components/ui/button';
import { Field, Input } from '@/components/ui/field';
import { InlineAlert } from '@/components/common/states';
import { AuthCard, AuthLayout, TextLink } from './auth-layout';
import { useForgotPassword } from './use-auth';

export default function ResetRequestPage() {
  const navigate = useNavigate();
  const forgot = useForgotPassword();
  const [email, setEmail] = useState('');
  const [invalid, setInvalid] = useState(false);
  const error = forgot.error && isApiError(forgot.error) ? forgot.error.error : null;

  function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const ok = /^\S+@\S+\.\S+$/.test(email.trim());
    setInvalid(!ok);
    if (!ok) focusFirstInvalid(e.currentTarget);
    if (ok) forgot.mutate(email, { onSuccess: () => navigate('/reset-password/sent') });
  }

  const retryMinutes = Math.ceil(Number(error?.details?.retry_after_seconds ?? 0) / 60);

  return (
    <AuthLayout width="max-w-[480px]">
      <AuthCard>
        <h1 className="text-2xl font-semibold text-fg">Reset your password</h1>
        <p className="mt-3 text-base text-fg-secondary">Enter your account email to get a reset link.</p>
        <form onSubmit={submit} noValidate className="mt-6 flex flex-col gap-5">
          {error ? (
            <InlineAlert tone="danger" title={error.code === 'RATE_LIMITED' ? 'Too many requests' : 'Link not sent'} live>
              {error.message}
              {retryMinutes ? ` Next request available in ${retryMinutes} min.` : ''}
            </InlineAlert>
          ) : null}
          <Field label="Email" error={invalid ? 'Enter the email you signed up with.' : null}>
            {({ id, describedBy, invalid: inv }) => (
              <Input id={id} type="email" autoComplete="email" spellCheck={false} placeholder="name@university.edu…" value={email} onChange={(e) => setEmail(e.target.value)} aria-describedby={describedBy} aria-invalid={inv} />
            )}
          </Field>
          <Button type="submit" variant="primary" size="lg" className="w-full" loading={forgot.isPending} loadingText="Sending…" disabled={error?.code === 'RATE_LIMITED'}>
            Send reset link
          </Button>
        </form>
        <p className="mt-6 text-center">
          <TextLink to="/sign-in">Back to sign in</TextLink>
        </p>
      </AuthCard>
    </AuthLayout>
  );
}
