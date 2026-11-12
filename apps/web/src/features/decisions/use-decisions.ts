import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { DecisionAlertListQuery, ProposeFromAlertRequest, UpdateDecisionAlertRequest } from '@contracts/types';
import { getDecisionAlert, listDecisionAlerts, proposeActionFromAlert, updateDecisionAlert } from '@/services/decision-alerts';
import { getMemory, setDependencies } from '@/services/memories';
import { qk } from '@/hooks/query-keys';

export function useDecisionAlerts(query: DecisionAlertListQuery) {
  return useQuery({ queryKey: qk.alerts(query), queryFn: () => listDecisionAlerts(query) });
}

export function useDecisionAlert(id: string | undefined) {
  return useQuery({ queryKey: qk.alert(id ?? ''), queryFn: () => getDecisionAlert(id!), enabled: Boolean(id) });
}

export function useDecision(id: string | null) {
  return useQuery({ queryKey: qk.memory(id ?? ''), queryFn: () => getMemory(id!), enabled: Boolean(id) });
}

/** Everything a decision change can affect: badges, lists, claims, timeline, activity. */
function useInvalidateDecisions() {
  const queryClient = useQueryClient();
  return () => {
    for (const key of [qk.alertsAll, qk.memoriesAll, qk.me, qk.claimsAll, qk.projects, qk.auditAll, qk.proposalsAll]) void queryClient.invalidateQueries({ queryKey: key });
  };
}

export function useUpdateDecisionAlert() {
  const invalidate = useInvalidateDecisions();
  return useMutation({ mutationFn: ({ id, request }: { id: string; request: UpdateDecisionAlertRequest }) => updateDecisionAlert(id, request), onSuccess: invalidate });
}

export function useProposeFromAlert() {
  const invalidate = useInvalidateDecisions();
  return useMutation({ mutationFn: ({ id, request }: { id: string; request?: ProposeFromAlertRequest }) => proposeActionFromAlert(id, request), onSuccess: invalidate });
}

export function useSetDependencies() {
  const invalidate = useInvalidateDecisions();
  return useMutation({ mutationFn: ({ id, claimIds }: { id: string; claimIds: string[] }) => setDependencies(id, claimIds), onSuccess: invalidate });
}
