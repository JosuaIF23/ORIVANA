import { redirect } from '@tanstack/react-router';
import { useUserStore } from '@/stores/userStore';
import { hasPermission, type Permission } from './permissions';
import { hasFeature } from './features';

/**
 * Creates a beforeLoad guard enforcing authentication and a specific permission.
 * Redirects unauthenticated users to /login and unauthorized users to /dashboard.
 */
export function requirePermissionBeforeLoad(permission: Permission) {
  return () => {
    const { token, user } = useUserStore.getState();

    if (!token || !user) {
      throw redirect({
        to: '/login',
        replace: true,
      });
    }

    if (!hasPermission(user, permission, useUserStore.getState().activeClientId)) {
      throw redirect({
        to: '/dashboard',
        replace: true,
      });
    }
  };
}

/**
 * Creates a beforeLoad guard enforcing that the active client's plan includes
 * a given feature key. Unlike requirePermissionBeforeLoad, a failed check
 * redirects to /billing (with the feature key in the search params) so the
 * user sees an upgrade prompt instead of a generic access-denied redirect.
 */
export function requireFeatureBeforeLoad(featureKey: string) {
  return () => {
    const { token, user } = useUserStore.getState();

    if (!token || !user) {
      throw redirect({
        to: '/login',
        replace: true,
      });
    }

    if (!hasFeature(user, featureKey, useUserStore.getState().activeClientId)) {
      throw redirect({
        to: '/billing',
        search: { feature: featureKey },
        replace: true,
      });
    }
  };
}

