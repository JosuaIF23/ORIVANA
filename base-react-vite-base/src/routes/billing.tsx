import { createFileRoute } from '@tanstack/react-router';
import { requirePermissionBeforeLoad } from '@/utils/route_guards';
import { useEffect, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fetchPlans, fetchCurrentSubscription, createCheckout, fetchUsageSummary } from '@/api/billing';
import type { Plan } from '@/types/plan';
import { Button } from '@/components/button';
import { Card } from '@/components/card';
import { PageSkeleton } from '@/components/loading_skeleton';
import { PageTransition } from '@/components/page_transition';
import { UpgradePrompt } from '@/components/upgrade_prompt';
import { DateDisplay } from '@/components/date_display';
import { useNotificationStore } from '@/stores/notificationStore';
import { CheckCircle2 } from 'lucide-react';
import { z } from 'zod';

const billingSearchSchema = z.object({
  feature: z.string().optional(),
  checkout: z.enum(['pending', 'failed']).optional(),
});

function formatPrice(plan: Plan): string {
  if (plan.price <= 0) return 'Free';
  const formatted = new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: plan.currency,
    maximumFractionDigits: 0,
  }).format(plan.price);
  return `${formatted} / ${plan.billing_interval}`;
}

function BillingPage() {
  const queryClient = useQueryClient();
  const search = Route.useSearch();
  const addNotification = useNotificationStore((state) => state.addNotification);

  const { data: plans = [], isLoading: isLoadingPlans } = useQuery({
    queryKey: ['billing-plans'],
    queryFn: fetchPlans,
  });

  const {
    data: subscription,
    isLoading: isLoadingSubscription,
  } = useQuery({
    queryKey: ['billing-subscription'],
    queryFn: fetchCurrentSubscription,
    // The DOKU webhook may land a moment after the checkout redirect - poll
    // briefly while we're waiting on it to confirm payment.
    refetchInterval: search.checkout === 'pending' ? 3000 : false,
  });

  const { data: usage = [] } = useQuery({
    queryKey: ['billing-usage'],
    queryFn: fetchUsageSummary,
  });

  useEffect(() => {
    if (search.checkout === 'pending' && subscription?.status === 'active') {
      addNotification({
        type: 'success',
        title: 'Subscription updated',
        message: `You're now on the ${subscription.plan_name} plan.`,
      });
    }
    if (search.checkout === 'failed') {
      addNotification({
        type: 'error',
        title: 'Checkout failed',
        message: 'The payment was not completed. You can try again below.',
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search.checkout, subscription?.status]);

  const checkoutMutation = useMutation({
    mutationFn: createCheckout,
    onSuccess: (result) => {
      if (result.payment_url) {
        window.location.href = result.payment_url;
        return;
      }
      queryClient.invalidateQueries({ queryKey: ['billing-subscription'] });
      addNotification({
        type: 'success',
        title: 'Plan updated',
        message: 'Your subscription has been updated successfully.',
      });
    },
    onError: (error: unknown) => {
      const message = error instanceof Error ? error.message : 'Failed to start checkout. Please try again.';
      addNotification({ type: 'error', title: 'Checkout failed', message });
    },
  });

  const sortedPlans = useMemo(() => [...plans].sort((a, b) => a.sort_order - b.sort_order), [plans]);

  if (isLoadingPlans || isLoadingSubscription) {
    return <PageSkeleton />;
  }

  return (
    <PageTransition>
      <div className="space-y-6">
        <div>
          <p className="text-sm text-gray-600">Subscription</p>
          <h1 className="text-2xl font-bold text-gray-900">Billing &amp; Plans</h1>
        </div>

        {search.feature && (
          <UpgradePrompt featureName={search.feature.replace(/_/g, ' ')} />
        )}

        {subscription && (
          <Card className="p-6">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <p className="text-sm text-gray-600">Current plan</p>
                <p className="text-xl font-bold text-gray-900">{subscription.plan_name}</p>
              </div>
              <div className="text-right">
                <p className="text-sm text-gray-600">Status</p>
                <p className="text-sm font-medium capitalize text-gray-900">{subscription.status}</p>
                {subscription.current_period_end && (
                  <p className="text-xs text-gray-500">
                    Renews <DateDisplay date={subscription.current_period_end} />
                  </p>
                )}
              </div>
            </div>
          </Card>
        )}

        {usage.length > 0 && (
          <Card className="p-6">
            <h2 className="text-sm font-semibold text-gray-700">Usage</h2>
            <div className="mt-4 space-y-4">
              {usage.map((metric) => {
                const percent = metric.is_unlimited
                  ? 0
                  : Math.min(100, Math.round((metric.current_value / Math.max(metric.max_value || 1, 1)) * 100));
                return (
                  <div key={metric.metric_key}>
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-medium text-gray-900">{metric.name}</span>
                      <span className={metric.is_at_limit ? 'font-medium text-red-600' : 'text-gray-600'}>
                        {metric.current_value} / {metric.is_unlimited ? 'Unlimited' : metric.max_value}
                      </span>
                    </div>
                    {!metric.is_unlimited && (
                      <div className="mt-1.5 h-2 w-full overflow-hidden rounded-full bg-gray-200">
                        <div
                          className={`h-full rounded-full ${metric.is_at_limit ? 'bg-red-500' : 'bg-primary-500'}`}
                          style={{ width: `${percent}%` }}
                        />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </Card>
        )}

        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          {sortedPlans.map((plan) => {
            const isCurrentPlan = subscription?.plan_key === plan.key;
            return (
              <Card key={plan.id} className={isCurrentPlan ? 'border-2 border-primary-500 p-6' : 'p-6'}>
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-bold text-gray-900">{plan.name}</h2>
                  {isCurrentPlan && (
                    <span className="flex items-center gap-1 text-xs font-medium text-primary-700">
                      <CheckCircle2 className="h-4 w-4" /> Current
                    </span>
                  )}
                </div>
                <p className="mt-1 text-2xl font-bold text-gray-900">{formatPrice(plan)}</p>
                {plan.description && <p className="mt-2 text-sm text-gray-600">{plan.description}</p>}

                <ul className="mt-4 space-y-2 text-sm text-gray-700">
                  {plan.feature_keys.length === 0 ? (
                    <li className="text-gray-500">Core RBAC, users, employees, branches</li>
                  ) : (
                    plan.feature_keys.map((featureKey) => (
                      <li key={featureKey} className="flex items-center gap-2">
                        <CheckCircle2 className="h-4 w-4 text-primary-600" />
                        <span className="capitalize">{featureKey.replace(/_/g, ' ')}</span>
                      </li>
                    ))
                  )}
                </ul>

                <Button
                  variant={isCurrentPlan ? 'secondary' : 'primary'}
                  className="mt-6 w-full"
                  disabled={isCurrentPlan || checkoutMutation.isPending}
                  isLoading={checkoutMutation.isPending && checkoutMutation.variables === plan.id}
                  onClick={() => checkoutMutation.mutate(plan.id)}
                >
                  {isCurrentPlan ? 'Current plan' : plan.price <= 0 ? 'Downgrade' : 'Upgrade'}
                </Button>
              </Card>
            );
          })}
        </div>
      </div>
    </PageTransition>
  );
}

export const Route = createFileRoute('/billing')({
  validateSearch: billingSearchSchema,
  beforeLoad: requirePermissionBeforeLoad('admin.subscriptions:read'),
  component: BillingPage,
});
