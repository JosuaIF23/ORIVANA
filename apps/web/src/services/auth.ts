import type {
  ForgotPasswordResponse,
  LoginRequest,
  LoginResponse,
  MeResponse,
  OkResponse,
  Preferences,
  RegisterRequest,
  RegisterResponse,
  ResendVerificationResponse,
  Session,
} from '@contracts/types';
import { nowIso } from '@/lib/clock';
import { fixtures } from './core/fixtures';
import { fail, failWith, simulate } from './core/http';
import { endSession, startSession } from './core/store';
import { requireDb } from './core/session';

/** POST /api/v1/auth/login */
export function login(request: LoginRequest): Promise<LoginResponse> {
  return simulate(() => {
    const email = request.email.trim().toLowerCase();
    const account = fixtures.auth.accounts.accounts.find((a) => a.email === email);
    if (account?.scenario === 'email_not_verified') {
      fail(fixtures.auth.loginUnverified, { details: { email, sent_at: fixtures.auth.loginUnverified.error.details?.sent_at } });
    }
    if (!account || account.password !== request.password) {
      failedAttempts += 1;
      if (failedAttempts > 3) fail(fixtures.auth.loginRateLimited);
      fail(fixtures.auth.loginInvalid, { details: { ...fixtures.auth.loginInvalid.error.details, attempts_left: 4 - failedAttempts } });
    }
    failedAttempts = 0;
    if (account.scenario === 'new_user') {
      startSession('new_user');
      return fixtures.auth.loginNewUser;
    }
    startSession('returning_user');
    return fixtures.auth.loginOk;
  }, { ms: 650 });
}

let failedAttempts = 0;
let resetRequests = 0;

/** POST /api/v1/auth/register */
export function register(request: RegisterRequest): Promise<RegisterResponse> {
  return simulate(() => {
    const email = request.email.trim().toLowerCase();
    if (fixtures.auth.accounts.accounts.some((a) => a.email === email)) fail(fixtures.auth.registerTaken);
    if (request.password.length < 12) fail(fixtures.auth.registerWeak);
    if (!request.accepted_terms) failWith('VALIDATION_FAILED', 'Accept the Terms to create an account.', { field: 'accepted_terms' });
    const response = structuredClone(fixtures.auth.registerOk);
    response.user.email = email;
    response.user.name = request.name?.trim() || null;
    response.verification_sent_to = email;
    return response;
  }, { ms: 700 });
}

/** POST /api/v1/auth/verify-email */
export function verifyEmail(token: string): Promise<LoginResponse> {
  return simulate(() => {
    if (!token || token === fixtures.auth.accounts.tokens.reset_expired || token.includes('expired')) fail(fixtures.auth.verifyExpired);
    startSession('new_user');
    return fixtures.auth.verifyOk;
  }, { ms: 600 });
}

/** POST /api/v1/auth/resend-verification */
export function resendVerification(email: string): Promise<ResendVerificationResponse> {
  return simulate(() => ({
    sent_to: email || fixtures.auth.resendOk.sent_to,
    resend_available_at: new Date(Date.parse(nowIso()) + 60_000).toISOString(),
  }));
}

/** POST /api/v1/auth/forgot-password */
export function forgotPassword(email: string): Promise<ForgotPasswordResponse> {
  return simulate(() => {
    resetRequests += 1;
    if (resetRequests > 3) fail(fixtures.auth.forgotRateLimited);
    return { ...fixtures.auth.forgotOk, sent_to: email.trim().toLowerCase() };
  });
}

/** POST /api/v1/auth/reset-password */
export function resetPassword(token: string, newPassword: string): Promise<LoginResponse> {
  return simulate(() => {
    if (token === fixtures.auth.accounts.tokens.reset_expired) fail(fixtures.auth.resetExpired);
    if (newPassword.length < 12) fail(fixtures.auth.registerWeak);
    startSession('returning_user');
    return fixtures.auth.resetOk;
  }, { ms: 650 });
}

/** POST /api/v1/auth/logout */
export function logout(): Promise<OkResponse> {
  return simulate(() => {
    endSession();
    return { ok: true as const };
  }, { ms: 200 });
}

/** GET /api/v1/me */
export function getMe(): Promise<MeResponse> {
  return simulate(() => {
    const db = requireDb();
    db.me.counts.pending_approvals = db.proposals.filter((p) => ['awaiting_approval', 'draft', 'validating'].includes(p.status)).length;
    db.me.counts.memories_needing_review = db.memories.filter((m) => m.status === 'candidate').length;
    db.me.counts.sources = db.sources.length;
    db.me.counts.projects = db.projects.length;
    db.me.counts.decisions_needing_review = db.decisions.filter((d) => d.review_state === 'needs_review' && d.status !== 'superseded').length;
    return db.me;
  }, { ms: 200 });
}

/** DELETE /api/v1/me */
export function deleteAccount(): Promise<OkResponse> {
  return simulate(() => {
    requireDb();
    endSession();
    return { ok: true as const };
  }, { ms: 900 });
}

export type UpdatePreferencesRequest = Partial<Preferences> & { onboarding_completed?: boolean };

/** GET /api/v1/me/preferences (extension) */
export function getPreferences(): Promise<Preferences> {
  return simulate(() => requireDb().preferences, { ms: 220 });
}

/** PATCH /api/v1/me/preferences (extension) */
export function updatePreferences(patch: UpdatePreferencesRequest): Promise<Preferences> {
  return simulate(() => {
    const db = requireDb();
    const { onboarding_completed, ...prefs } = patch;
    db.preferences = { ...db.preferences, ...prefs };
    if (onboarding_completed !== undefined) db.me.onboarding_completed = onboarding_completed;
    return db.preferences;
  }, { ms: 300 });
}

/** GET /api/v1/me/sessions (extension) */
export function getSessions(): Promise<Session[]> {
  return simulate(() => requireDb().sessions, { ms: 250 });
}

/** POST /api/v1/me/sessions/revoke-others (extension) */
export function revokeOtherSessions(): Promise<{ revoked: number }> {
  return simulate(() => {
    const db = requireDb();
    const others = db.sessions.filter((s) => !s.current && !s.revoked_at);
    others.forEach((s) => (s.revoked_at = nowIso()));
    return { revoked: others.length };
  });
}
