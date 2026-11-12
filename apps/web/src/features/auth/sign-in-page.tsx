import { useState, type FormEvent } from 'react';
import { useLocation, useNavigate, useSearchParams } from 'react-router';
import { isApiError } from '@/services/core/http';
import { focusFirstInvalid } from '@/lib/focus';
import { Button } from '@/components/ui/button';
import { Field, Input } from '@/components/ui/field';
import { InlineAlert } from '@/components/common/states';
import { AuthCard, AuthLayout, TextLink } from './auth-layout';
import { PasswordInput } from './password-input';
import { SignInError } from './sign-in-error';
import { demoAccount, useLogin } from './use-auth';

export default function SignInPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [params] = useSearchParams();
  const login = useLogin();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [emailError, setEmailError] = useState<string | null>(null);

  const error = login.error && isApiError(login.error) ? login.error.error : null;
  const passwordError = error?.code === 'INVALID_CREDENTIALS' ? 'Password doesn’t match this email.' : null;
  const from = (location.state as { from?: string } | null)?.from;

  function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    if (!/^\S+@\S+\.\S+$/.test(email.trim())) {
      setEmailError('Enter the email you signed up with.');
      focusFirstInvalid(e.currentTarget as HTMLFormElement);
      return;
    }
    setEmailError(null);
    login.mutate(
      { email, password },
      {
        onSuccess: (res) => navigate(res.onboarding_completed ? (from ?? '/home') : '/onboarding/welcome', { replace: true }),
        onError: () => focusFirstInvalid(form),
      },
    );
  }

  function fillDemo() {
    const account = demoAccount('returning_user');
    setEmail(account.email);
    setPassword(account.password);
  }

  return (
    <AuthLayout>
      <h1 className="text-2xl font-semibold text-fg">Sign in to ORIVANA</h1>
      <p className="mt-2 text-base text-fg-secondary">Your Knowledge, Connected. Your Intent, in Motion.</p>
      {params.get('expired') ? (
        <InlineAlert tone="info" className="mt-6" title="Your session expired">
          Sign in again to continue where you left off.
        </InlineAlert>
      ) : null}
      <AuthCard className="mt-8">
        <form onSubmit={submit} noValidate className="flex flex-col gap-5">
          {error ? <SignInError error={error} email={email} /> : null}
          <Field label="Email" error={emailError}>
            {({ id, describedBy, invalid }) => (
              <Input id={id} type="email" name="email" autoComplete="email" inputMode="email" placeholder="name@university.edu…" value={email} onChange={(e) => setEmail(e.target.value)} aria-describedby={describedBy} aria-invalid={invalid} spellCheck={false} required />
            )}
          </Field>
          <Field label="Password" error={passwordError} action={<TextLink to="/reset-password" className="text-sm">Forgot password?</TextLink>}>
            {({ id, describedBy, invalid }) => (
              <PasswordInput id={id} name="password" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} aria-describedby={describedBy} aria-invalid={invalid} required />
            )}
          </Field>
          <Button type="submit" variant="primary" size="lg" className="w-full" loading={login.isPending} loadingText="Signing in…" disabled={error?.code === 'RATE_LIMITED'}>
            Sign in
          </Button>
        </form>
      </AuthCard>
      <p className="mt-8 text-center text-base text-fg-secondary">
        New to ORIVANA? <TextLink to="/sign-up">Create an account</TextLink>
      </p>
      <p className="mx-auto mt-6 max-w-sm text-center text-sm text-fg-secondary">Signing in never connects your other apps. You choose what to connect later, in Integrations.</p>
      <button type="button" onClick={fillDemo} className="mx-auto mt-6 rounded-control text-sm text-accent underline underline-offset-4 hover:text-fg">
        Prototype: fill the demo account
      </button>
    </AuthLayout>
  );
}
