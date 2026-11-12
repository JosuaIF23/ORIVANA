import type { AuthUser } from '@/types/auth_user';

/**
 * Plan entitlement is a property of the active tenant, not the acting user's
 * role - so this stays independent of permissions.ts (see hasPermission).
 * A client-admin on the Free plan is still blocked from Pro-only features.
 */
export function getActiveClientFeatures(user: AuthUser | null, activeClientIdOverride?: number | null): string[] {
  if (!user) {
    return [];
  }

  const storedActiveClientId = localStorage.getItem('active_client_id');
  const activeClientId = activeClientIdOverride ?? (storedActiveClientId ? parseInt(storedActiveClientId, 10) : null);
  const activeClient = activeClientId
    ? user.clients?.find((client) => client.id === activeClientId)
    : undefined;

  return Array.isArray(activeClient?.features) ? activeClient.features : [];
}

export function hasFeature(user: AuthUser | null, featureKey: string, activeClientId?: number | null): boolean {
  return getActiveClientFeatures(user, activeClientId).includes(featureKey);
}

export function getActivePlanName(user: AuthUser | null, activeClientIdOverride?: number | null): string | undefined {
  if (!user) {
    return undefined;
  }

  const storedActiveClientId = localStorage.getItem('active_client_id');
  const activeClientId = activeClientIdOverride ?? (storedActiveClientId ? parseInt(storedActiveClientId, 10) : null);
  const activeClient = activeClientId
    ? user.clients?.find((client) => client.id === activeClientId)
    : undefined;

  return activeClient?.plan_name;
}
