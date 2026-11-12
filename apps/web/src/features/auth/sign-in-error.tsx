import { Mail, RotateCw } from 'lucide-react';
import type { ApiError } from '@contracts/types';
import { formatDayMonth } from '@/lib/format';
import { Button } from '@/components/ui/button';
import { InlineAlert } from '@/components/common/states';
import { TextLink } from './auth-layout';
import { rememberPendingEmail, useResendVerification } from './use-auth';

/** The error states from "Sign in · invalid credentials + email not verified". */
export function SignInError({ error, email }: { error: ApiError; email: string }) {
  const resend = useResendVerification();
  if (error.code === 'INVALID_CREDENTIALS') {
    const left = Number(error.details?.attempts_left ?? 0);
    const pause = Number(error.details?.lockout_minutes ?? 10);
    return (
      <InlineAlert tone="danger" title="Email or password is incorrect" live>
        Check both and try again, or <TextLink to="/reset-password">reset your password</TextLink>. {left} {left === 1 ? 'attempt' : 'attempts'} left before a {pause}-minute pause.
      </InlineAlert>
    );
  }
  if (error.code === 'EMAIL_NOT_VERIFIED') {
    const address = String(error.details?.email ?? email);
    const sentAt = typeof error.details?.sent_at === 'string' ? formatDayMonth(error.details.sent_at) : null;
    return (
      <div className="flex flex-col gap-4">
        <InlineAlert tone="warning" icon={<Mail className="text-warning" />} title="Verify your email to continue" live>
          ORIVANA sent a link to <strong className="font-semibold text-fg">{address}</strong>
          {sentAt ? ` on ${sentAt}` : ''}. You need to verify before uploading sources.
        </InlineAlert>
        <Button
          variant="secondary"
          size="lg"
          className="w-full"
          loading={resend.isPending}
          loadingText="Sending…"
          onClick={() => {
            rememberPendingEmail(address);
            resend.mutate(address);
          }}
        >
          <RotateCw aria-hidden="true" />
          Resend verification email
        </Button>
        <p role="status" className="text-center text-sm text-fg-secondary">
          {resend.isSuccess ? (
            <>Sent again to {resend.data.sent_to}. </>
          ) : null}
          Didn’t get it? Check spam, or <TextLink to="/sign-up">use a different email</TextLink>.
        </p>
        <p className="text-center text-sm">
          <TextLink to="/check-email" className="text-sm">
            Prototype: open “Check your email”
          </TextLink>
        </p>
      </div>
    );
  }
  return (
    <InlineAlert tone="danger" title={error.code === 'RATE_LIMITED' ? 'Too many attempts' : 'Sign-in failed'} live>
      {error.message}
    </InlineAlert>
  );
}
