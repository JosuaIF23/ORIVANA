import { Mail } from 'lucide-react';
import { demoToken } from '@/services/demo';
import { ButtonLink } from '@/components/ui/button';
import { AuthCard, AuthLayout, TextLink } from './auth-layout';
import { readPendingEmail } from './use-auth';

export default function ResetSentPage() {
  const email = readPendingEmail() || 'your email';
  return (
    <AuthLayout width="max-w-[480px]">
      <AuthCard>
        <Mail aria-hidden="true" className="size-8 text-knowledge" />
        <h1 className="mt-5 text-2xl font-semibold text-fg">Reset link sent</h1>
        <p role="status" className="mt-3 text-base text-fg-secondary">
          If an account exists for <strong className="font-semibold text-fg">{email}</strong>, a link is on its way. It works once and expires in 30 minutes.
        </p>
        <ButtonLink to="/sign-in" size="lg" className="mt-6 w-full">
          Back to sign in
        </ButtonLink>
        <div className="mt-6 flex flex-col items-center gap-2 text-sm">
          <TextLink to={`/reset-password/new?token=${demoToken('reset_valid')}`}>Prototype: open the reset link</TextLink>
          <TextLink to={`/reset-password/new?token=${demoToken('reset_expired')}`}>Prototype: open an expired link</TextLink>
        </div>
      </AuthCard>
    </AuthLayout>
  );
}
