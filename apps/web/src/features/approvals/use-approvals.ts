import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { CreateIssueArguments } from '@contracts/types';
import { approveProposal, discardEditing, rejectProposal, startEditing, updateProposal } from '@/services/proposals';
import { listRepositories } from '@/services/connections';
import { qk } from '@/hooks/query-keys';

function useInvalidate() {
  const queryClient = useQueryClient();
  return () => {
    void queryClient.invalidateQueries({ queryKey: qk.proposalsAll });
    void queryClient.invalidateQueries({ queryKey: qk.me });
    void queryClient.invalidateQueries({ queryKey: qk.auditAll });
    void queryClient.invalidateQueries({ queryKey: qk.projects });
  };
}

export function useApprove() {
  const invalidate = useInvalidate();
  return useMutation({ mutationFn: approveProposal, onSuccess: invalidate });
}

export function useReject() {
  const invalidate = useInvalidate();
  return useMutation({ mutationFn: ({ id, reason }: { id: string; reason?: string }) => rejectProposal(id, reason), onSuccess: invalidate });
}

export function useStartEditing() {
  const invalidate = useInvalidate();
  return useMutation({ mutationFn: startEditing, onSuccess: invalidate });
}

export function useDiscardEditing() {
  const invalidate = useInvalidate();
  return useMutation({ mutationFn: discardEditing, onSuccess: invalidate });
}

export function useUpdateProposal() {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: ({ id, args, revision }: { id: string; args: CreateIssueArguments; revision: number }) => updateProposal(id, args, revision),
    onSuccess: invalidate,
  });
}

export function useRepositories() {
  return useQuery({ queryKey: qk.repositories, queryFn: listRepositories });
}
