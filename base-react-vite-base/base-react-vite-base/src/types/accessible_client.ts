export interface MembershipRole {
  id: number;
  key: string;
  name: string;
  client_id: number | null;
}

export interface AccessibleClient {
  id: number;
  name: string;
  code: string;
  roles: MembershipRole[];
  primary_role: MembershipRole | null;
  branch_id: number | null;
  is_default: boolean;
  permissions?: string[];
  plan_key?: string;
  plan_name?: string;
  subscription_status?: string;
  features?: string[];
}
