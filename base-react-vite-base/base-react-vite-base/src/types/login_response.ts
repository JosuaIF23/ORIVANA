import type { AuthUser } from './auth_user';
import type { AccessibleClient } from './accessible_client';

export interface LoginResponse {
  token: string;
  user: AuthUser;
}

export interface ApiLoginResponse {
  data: {
    token: string;
    user: {
      id: number;
      name: string;
      email: string;
      client_id?: number;
      branch_id?: number;
      must_change_password?: boolean;
      permissions?: string[];
      clients?: AccessibleClient[];
    };
  };
  message?: string;
}


