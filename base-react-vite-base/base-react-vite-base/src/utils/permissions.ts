import type { AuthUser } from '@/types/auth_user';

export type Permission = string;

export function getUserPermissions(user: AuthUser | null, activeClientIdOverride?: number | null): Permission[] {
  if (!user) {
    return [];
  }

  const storedActiveClientId = localStorage.getItem('active_client_id');
  const activeClientId = activeClientIdOverride ?? (storedActiveClientId ? parseInt(storedActiveClientId, 10) : null);
  const activeClient = activeClientId
    ? user.clients?.find((client) => client.id === activeClientId)
    : undefined;

  if (activeClient?.permissions && Array.isArray(activeClient.permissions)) {
    return activeClient.permissions;
  }

  return Array.isArray(user.permissions) ? user.permissions : [];
}

export function hasPermission(user: AuthUser | null, permission: Permission, activeClientId?: number | null): boolean {
  if (!user) {
    return false;
  }
  const userPermissions = getUserPermissions(user, activeClientId);
  return userPermissions.includes(permission);
}

export function hasAnyPermission(user: AuthUser | null, permissions: Permission[], activeClientId?: number | null): boolean {
  if (!user || permissions.length === 0) {
    return false;
  }
  return permissions.some((permission) => hasPermission(user, permission, activeClientId));
}

export function hasAllPermissions(user: AuthUser | null, permissions: Permission[], activeClientId?: number | null): boolean {
  if (!user || permissions.length === 0) {
    return false;
  }
  return permissions.every((permission) => hasPermission(user, permission, activeClientId));
}

export function canSeeClientDimension(user: AuthUser | null, activeClientId?: number | null): boolean {
  return hasPermission(user, 'admin.clients:read', activeClientId);
}
