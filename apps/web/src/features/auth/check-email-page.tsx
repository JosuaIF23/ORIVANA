import { useEffect, useState } from 'react';
import { Link } from 'react-router';
import { Mail } from 'lucide-react';
import { now } from '@/lib/clock';
import { demoToken } from '@/services/demo';
import { Button } from '@/components/ui/button';
import { AuthCard, AuthLayout, TextLink } from './auth-layout';
import { readPendingEmail, useResendVerification } from './use-auth';

const INITIAL_COOLDOWN = 42;

function useCountdown(target: number | null) {
  const [left, setLeft] = useState(() => (target ? Math.max(0, Math.round((target - now().getTime()) / 1000)) : 0));
  useEffect(() => {
    if (!target) return;
    const tick = () => setLeft(Math.max(0, Math.round((target - now().getTime()) / 1000)));
    tick();
    const id = window.setInterval(tick, 1000);
    return () => window.clearInterval(id);
  }, [target]);
  return left;
}

export default function CheckEmailPage() {
  const email = readPendingEmail() || 'your email';
  const resend = useResendVerification();
  const [availableAt, setAvailableAt] = useState(() => now().getTime() + INITIAL_COOLDOWN * 1000);
  const left = useCountdown(availableAt);
  const mm = Math.floor(left / 60);
  const ss = String(left % 60).padStart(2, '0');

  return (
    <AuthLayout width="max-w-[640px]" footer={false}>
      <AuthCard className="md:p-12">
        <span className="flex size-14 items-center justify-center rounded-full bg-accent/15 text-accent">
          <Mail aria-hidden="true" className="size-6" />
        </span>
        <h1 className="mt-6 text-2xl font-semibold text-fg">Check your email</h1>
        <p className="mt-3 text-lg text-fg-secondary">
          ORIVANA sent a verification link to <strong className="font-semibold text-fg">{email}</strong>. It expires in 24 hours.
        </p>
        <ol className="mt-6 flex list-decimal flex-col gap-3 pl-6 text-base text-fg-secondary">
          <li>Open the email from ORIVANA.</li>
          <li>
            Select <strong className="font-semibold text-fg">Verify email</strong>.
          </li>
          <li>You’ll land in a short setup — about two minutes.</li>
        </ol>
        <hr className="my-6 border-subtle" />
        <Button
          size="lg"
          className="w-full"
          disabled={left > 0}
          loading={resend.isPending}
          loadingText="Sending…"
          onClick={() => resend.mutate(email, { onSuccess: (res) => setAvailableAt(Date.parse(res.resend_available_at)) })}
        >
          Resend email
        </Button>
        <p role="status" aria-live="polite" className="mt-3 text-center text-sm text-fg-secondary">
          {left > 0 ? `You can resend in ${mm}:${ss}. ` : resend.isSuccess ? `Sent again to ${resend.data.sent_to}. ` : ''}
          Check your spam folder meanwhile.
        </p>
        <p className="mt-6 text-center">
          <Link to="/sign-up" className="rounded-control text-base font-medium text-fg-secondary hover:text-fg">
            Wrong address? Change email
          </Link>
        </p>
        <p className="mt-8 text-center">
          <TextLink to={`/verify-email?token=${demoToken('verify_valid')}`} className="text-sm">
            Prototype: open the verification link
          </TextLink>
        </p>
      </AuthCard>
    </AuthLayout>
  );
}
