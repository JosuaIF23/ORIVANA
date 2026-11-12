import type { AccessibleClient, MembershipRole } from './accessible_client';

export interface AuthUser {
  id: number;
  name: string;
  email: string;
  client_id?: number;
  branch_id?: number;
  must_change_password?: boolean;
  permissions?: string[];
  clients?: AccessibleClient[];
  roles?: MembershipRole[];
  primary_role?: MembershipRole | null;
}

