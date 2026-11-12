import { Navigate, useLocation, useNavigate, useParams } from 'react-router';
import { useMe } from '@/hooks/use-session';
import { isApiError } from '@/services/core/http';
import { ErrorState } from '@/components/common/states';
import { Spinner } from '@/components/ui/spinner';
import { OnboardingHeader, STEPS, type StepKey } from './onboarding-header';
import { StepWelcome } from './step-welcome';
import { StepSource } from './step-source';
import { StepQuestion } from './step-question';
import { useUpdatePreferences } from './use-onboarding';

/** Three-step setup: Welcome → First source → First question (design 11 + Onboarding 2/3). */
export default function OnboardingPage() {
  const { step = 'welcome' } = useParams();
  const { data: me, error, isPending, refetch } = useMe();
  const location = useLocation();
  const navigate = useNavigate();
  const update = useUpdatePreferences();

  if (isPending) {
    return (
      <div role="status" className="flex h-dvh items-center justify-center gap-3 text-fg-secondary">
        <Spinner /> Loading…
      </div>
    );
  }
  if (error) {
    if (isApiError(error) && error.status === 401) return <Navigate to="/sign-in" replace state={{ from: location.pathname }} />;
    return <ErrorState className="m-8" error={error} onRetry={() => refetch()} />;
  }
  if (!STEPS.some((s) => s.key === step)) return <Navigate to="/onboarding/welcome" replace />;

  const finish = () => update.mutate({ onboarding_completed: true }, { onSuccess: () => navigate('/home', { replace: true }) });
  const current = step as StepKey;

  return (
    <div className="min-h-dvh bg-app">
      <OnboardingHeader current={current} onSkip={finish} skipping={update.isPending} />
      <main id="main" className="mx-auto w-full max-w-[880px] px-4 py-10 md:py-12">
        {current === 'welcome' ? <StepWelcome firstName={me.user.name?.split(' ')[0] ?? null} /> : null}
        {current === 'source' ? <StepSource /> : null}
        {current === 'question' ? <StepQuestion onFinish={finish} finishing={update.isPending} /> : null}
      </main>
    </div>
  );
}
