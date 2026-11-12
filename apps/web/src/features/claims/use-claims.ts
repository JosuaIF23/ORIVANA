import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { ClaimDetail, ClaimListQuery, UpdateClaimRequest } from '@contracts/types';
import { getClaim, listClaims, updateClaim } from '@/services/claims';
import { qk } from '@/hooks/query-keys';
import type { CompareItem } from '@/components/common/evidence-compare';

export function useClaims(query: ClaimListQuery) {
  return useQuery({ queryKey: qk.claims(query), queryFn: () => listClaims(query), placeholderData: keepPreviousData });
}

export function useClaim(id: string | null) {
  return useQuery({ queryKey: qk.claim(id ?? ''), queryFn: () => getClaim(id!), enabled: Boolean(id) });
}

export function useUpdateClaim() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, request }: { id: string; request: UpdateClaimRequest }) => updateClaim(id, request),
    onSuccess: (claim) => {
      queryClient.setQueryData(qk.claim(claim.id), claim);
      for (const key of [qk.claimsAll, qk.auditAll, qk.search('')]) void queryClient.invalidateQueries({ queryKey: key });
    },
  });
}

/** Flattens a claim's evidence for one stance into comparison items (first passage per paper). */
export function stanceItems(claim: ClaimDetail, stance: 'supports' | 'contradicts' | 'mentions'): CompareItem[] {
  return claim.evidence
    .filter((e) => e.stance === stance)
    .flatMap((e) => {
      const p = e.evidence[0];
      if (!p) return [];
      return [{ key: e.relationship_id, source_id: e.source_id, source_label: e.source_label, source_title: e.source_title, chunk_id: p.chunk_id, page: p.page, section: p.section, passage: p.passage, char_start: p.char_start, char_end: p.char_end, imported_at: e.imported_at, status: e.status }];
    });
}
