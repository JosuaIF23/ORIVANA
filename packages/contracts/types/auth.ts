import type { Id, ISODateTime } from './common';

/** users (PRD §10). `password_hash` never leaves the server. */
export interface User {
  id: Id;
  email: string;
  name: string | null;
  email_verified_at: ISODateTime | null;
  status: 'active' | 'pending_verification' | 'disabled';
  initials: string;
  time_zone: string;
  created_at: ISODateTime;
}

/** sessions (PRD §10), as shown in Settings → Security & sessions. */
export interface Session {
  id: Id;
  user_agent: string;
  ip: string;
  created_at: ISODateTime;
  expires_at: ISODateTime;
  revoked_at: ISODateTime | null;
  current: boolean;
}

export interface RegisterRequest {
  name?: string;
  email: string;
  password: string;
  accepted_terms: boolean;
}

export interface RegisterResponse {
  user: User;
  verification_sent_to: string;
  verification_expires_at: ISODateTime;
  resend_available_at: ISODateTime;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  user: User;
  session: Pick<Session, 'id' | 'expires_at'>;
  onboarding_completed: boolean;
}

export interface VerifyEmailRequest {
  token: string;
}

export interface ResendVerificationRequest {
  email: string;
}

export interface ResendVerificationResponse {
  sent_to: string;
  resend_available_at: ISODateTime;
}

export interface ForgotPasswordRequest {
  email: string;
}

export interface ForgotPasswordResponse {
  /** Always returned, whether or not the account exists. */
  sent_to: string;
  expires_in_minutes: number;
}

export interface ResetPasswordRequest {
  token: string;
  new_password: string;
}

export interface OkResponse {
  ok: true;
}
