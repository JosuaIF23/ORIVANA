import { useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router';
import { CircleCheck, Clock } from 'lucide-react';
import { isApiError } from '@/services/core/http';
import { Button, ButtonLink } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';
import { AuthCard, AuthLayout } from './auth-layout';
import { readPendingEmail, useResendVerification, useVerifyEmail } from './use-auth';

/** Landing page of the verification email link. */
export default function VerifyEmailPage() {
  const [params] = useSearchParams();
  const token = params.get('token') ?? '';
  const navigate = useNavigate();
  const verify = useVerifyEmail();
  const resend = useResendVerification();
  const started = useRef(false);

  useEffect(() => {
    if (started.current) return;
    started.current = true;
    verify.mutate(token);
  }, [token, verify]);

  const expired = verify.error && isApiError(verify.error) && verify.error.error.code === 'TOKEN_EXPIRED';

  return (
    <AuthLayout width="max-w-[560px]" footer={false}>
      <AuthCard className="md:p-10" >
        {verify.isPending || verify.isIdle ? (
          <p role="status" className="flex items-center gap-3 text-base text-fg-secondary">
            <Spinner /> Verifying your email…
          </p>
        ) : verify.isSuccess ? (
          <div role="status">
            <CircleCheck aria-hidden="true" className="size-8 text-knowledge" />
            <h1 className="mt-4 text-2xl font-semibold text-fg">Email verified</h1>
            <p className="mt-2 text-base text-fg-secondary">{verify.data.user.email} is confirmed. Your private workspace is ready.</p>
            <Button variant="primary" size="lg" className="mt-6 w-full" onClick={() => navigate('/onboarding/welcome', { replace: true })}>
              Start setup
            </Button>
          </div>
        ) : (
          <div role="alert">
            <Clock aria-hidden="true" className="size-8 text-warning" />
            <h1 className="mt-4 text-2xl font-semibold text-fg">{expired ? 'This link has expired' : 'We couldn’t verify this link'}</h1>
            <p className="mt-2 text-base text-fg-secondary">Verification links work once and only for 24 hours. Send a new one to continue.</p>
            <Button size="lg" className="mt-6 w-full" loading={resend.isPending} onClick={() => resend.mutate(readPendingEmail())}>
              Send a new link
            </Button>
            {resend.isSuccess ? <p className="mt-3 text-sm text-fg-secondary">Sent to {resend.data.sent_to}.</p> : null}
            <ButtonLink to="/sign-in" variant="ghost" className="mt-3 w-full">
              Back to sign in
            </ButtonLink>
          </div>
        )}
      </AuthCard>
    </AuthLayout>
  );
}
