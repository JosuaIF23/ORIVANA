export type SubscriptionStatus = 'trialing' | 'active' | 'past_due' | 'canceled' | 'incomplete';

export interface Subscription {
  subscription_id: number;
  plan_id: number;
  plan_key: string;
  plan_name: string;
  status: SubscriptionStatus;
  current_period_end: string | null;
  is_active: boolean;
  feature_keys: string[];
}
