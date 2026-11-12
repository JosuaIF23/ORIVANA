import { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router';
import { isApiError } from '@/services/core/http';
import { focusFirstInvalid } from '@/lib/focus';
import { Button } from '@/components/ui/button';
import { Field, Input } from '@/components/ui/field';
import { Checkbox } from '@/components/ui/controls';
import { InlineAlert } from '@/components/common/states';
import { AuthCard, AuthLayout, TextLink } from './auth-layout';
import { PasswordInput, StrengthMeter } from './password-input';
import { useRegister } from './use-auth';

export default function SignUpPage() {
  const navigate = useNavigate();
  const register = useRegister();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [accepted, setAccepted] = useState(false);
  const [touched, setTouched] = useState(false);

  const apiError = register.error && isApiError(register.error) ? register.error.error : null;
  const fieldError = (field: string) => (apiError?.details?.field === field ? apiError.message : null);
  const emailError = touched && !/^\S+@\S+\.\S+$/.test(email.trim()) ? 'Enter a valid email address.' : fieldError('email');
  const passwordError = touched && password.length < 12 ? 'Use at least 12 characters.' : fieldError('password');
  const termsError = touched && !accepted ? 'Accept the Terms to create an account.' : null;

  function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setTouched(true);
    if (!/^\S+@\S+\.\S+$/.test(email.trim()) || password.length < 12 || !accepted) {
      focusFirstInvalid(e.currentTarget);
      return;
    }
    register.mutate({ name, email, password, accepted_terms: accepted }, { onSuccess: () => navigate('/check-email') });
  }

  return (
    <AuthLayout width="max-w-[560px]" footer={false}>
      <h1 className="text-2xl font-semibold text-fg">Create your account</h1>
      <p className="mt-2 text-base text-fg-secondary">A private workspace for your papers, notes, and project decisions.</p>
      <AuthCard className="mt-8">
        <form onSubmit={submit} noValidate className="flex flex-col gap-5">
          {apiError && !apiError.details?.field ? (
            <InlineAlert tone="danger" title="Account not created" live>
              {apiError.message}
            </InlineAlert>
          ) : null}
          <Field label="Name" labelSuffix="(optional)">
            {({ id }) => <Input id={id} name="name" autoComplete="name" value={name} onChange={(e) => setName(e.target.value)} />}
          </Field>
          <Field label="Email" error={emailError}>
            {({ id, describedBy, invalid }) => (
              <Input id={id} type="email" name="email" autoComplete="email" spellCheck={false} placeholder="name@university.edu…" value={email} onChange={(e) => setEmail(e.target.value)} aria-describedby={describedBy} aria-invalid={invalid} />
            )}
          </Field>
          <Field label="Password" error={passwordError}>
            {({ id, describedBy, invalid }) => (
              <div className="flex flex-col gap-3">
                <PasswordInput id={id} name="new-password" autoComplete="new-password" value={password} onChange={(e) => setPassword(e.target.value)} aria-describedby={[describedBy, `${id}-strength`].filter(Boolean).join(' ')} aria-invalid={invalid} />
                <StrengthMeter id={`${id}-strength`} value={password} />
              </div>
            )}
          </Field>
          <div className="flex flex-col gap-2">
            <div className="flex items-start gap-3">
              <Checkbox id="terms" checked={accepted} onCheckedChange={setAccepted} aria-invalid={Boolean(termsError)} aria-describedby={termsError ? 'terms-error' : undefined} className="mt-0.5" />
              <label htmlFor="terms" className="text-base text-fg">
                I agree to the <a href="#terms" className="text-accent underline underline-offset-4">Terms</a> and have read the <a href="#privacy" className="text-accent underline underline-offset-4">Privacy notice</a>.
              </label>
            </div>
            {termsError ? (
              <p id="terms-error" className="text-sm text-danger">
                {termsError}
              </p>
            ) : null}
          </div>
          <Button type="submit" variant="primary" size="lg" className="w-full" loading={register.isPending} loadingText="Creating account…">
            Create account
          </Button>
          <p className="text-sm text-fg-secondary">ORIVANA will email you a link to verify your address. Uploading sources unlocks after verification.</p>
        </form>
      </AuthCard>
      <p className="mt-8 text-center text-base text-fg-secondary">
        Already have an account? <TextLink to="/sign-in">Sign in</TextLink>
      </p>
    </AuthLayout>
  );
}
