import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router';
import { getMe, logout } from '@/services/auth';
import { isApiError } from '@/services/core/http';
import { qk } from './query-keys';

/** Current user + workspace. 401 means signed out. */
export function useMe() {
  return useQuery({
    queryKey: qk.me,
    queryFn: getMe,
    retry: (count, error) => !(isApiError(error) && error.status === 401) && count < 2,
    staleTime: 10_000,
  });
}

export function useSignOut() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  return useMutation({
    mutationFn: logout,
    onSuccess: () => {
      queryClient.clear();
      navigate('/sign-in', { replace: true });
    },
  });
}
