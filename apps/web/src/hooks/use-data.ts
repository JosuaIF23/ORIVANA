/**
 * Shared read hooks used across features. Mutations live next to the
 * features that own them.
 */
import { useQuery } from '@tanstack/react-query';
import type { AuditListQuery } from '@contracts/types';
import { listProjects, getProject } from '@/services/projects';
import { listProposals, getProposal, type ProposalTab } from '@/services/proposals';
import { listConnections } from '@/services/connections';
import { listAuditEvents } from '@/services/audit';
import { getSuggestions } from '@/services/workspace';
import { listConversations } from '@/services/conversations';
import { qk } from './query-keys';

export function useProjectsList() {
  return useQuery({ queryKey: qk.projects, queryFn: listProjects });
}

export function useProject(id: string | undefined) {
  return useQuery({ queryKey: qk.project(id ?? ''), queryFn: () => getProject(id!), enabled: Boolean(id) });
}

export function useProposals(tab: ProposalTab) {
  return useQuery({
    queryKey: qk.proposals(tab),
    queryFn: () => listProposals(tab),
    refetchInterval: (q) => (q.state.data?.items.some((p) => p.status === 'executing' || p.status === 'verifying') ? 1000 : false),
  });
}

/** Polls while the proposal is executing so success appears only after verification. */
export function useProposal(id: string | undefined | null) {
  return useQuery({
    queryKey: qk.proposal(id ?? ''),
    queryFn: () => getProposal(id!),
    enabled: Boolean(id),
    refetchInterval: (q) => (q.state.data && ['executing', 'verifying', 'approved'].includes(q.state.data.status) ? 700 : false),
  });
}

export function useConnectionsList() {
  return useQuery({ queryKey: qk.connections, queryFn: listConnections });
}

export function useAuditEvents(query: AuditListQuery & { limit?: number }) {
  return useQuery({ queryKey: qk.audit(query), queryFn: () => listAuditEvents(query) });
}

export function useSuggestions() {
  return useQuery({ queryKey: qk.suggestions, queryFn: getSuggestions });
}

export function useConversations(projectId?: string | null) {
  return useQuery({ queryKey: [...qk.conversations, projectId ?? 'all'], queryFn: () => listConversations(projectId) });
}
