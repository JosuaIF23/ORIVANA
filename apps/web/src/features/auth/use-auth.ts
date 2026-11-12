import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { LoginResponse } from '@contracts/types';
import { forgotPassword, login, register, resendVerification, resetPassword, verifyEmail } from '@/services/auth';
import { demoAccount } from '@/services/demo';
import { qk } from '@/hooks/query-keys';

export const PENDING_EMAIL_KEY = 'orivana.auth.pendingEmail';

export function rememberPendingEmail(email: string) {
  try {
    sessionStorage.setItem(PENDING_EMAIL_KEY, email);
  } catch {
    /* ignore */
  }
}

export function readPendingEmail(): string {
  try {
    return sessionStorage.getItem(PENDING_EMAIL_KEY) ?? '';
  } catch {
    return '';
  }
}

/** After any sign-in, reset cached data from a previous session. */
function useSignedIn() {
  const queryClient = useQueryClient();
  return (res: LoginResponse) => {
    queryClient.clear();
    return res;
  };
}

export function useLogin() {
  const signedIn = useSignedIn();
  return useMutation({ mutationFn: login, onSuccess: signedIn });
}

export function useRegister() {
  return useMutation({ mutationFn: register, onSuccess: (res) => rememberPendingEmail(res.verification_sent_to) });
}

export function useVerifyEmail() {
  const signedIn = useSignedIn();
  return useMutation({ mutationFn: verifyEmail, onSuccess: signedIn });
}

export function useResendVerification() {
  return useMutation({ mutationFn: resendVerification });
}

export function useForgotPassword() {
  return useMutation({ mutationFn: forgotPassword, onSuccess: (res) => rememberPendingEmail(res.sent_to) });
}

export function useResetPassword() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ token, password }: { token: string; password: string }) => resetPassword(token, password),
    onSuccess: () => queryClient.removeQueries({ queryKey: qk.me }),
  });
}

export { demoAccount };
