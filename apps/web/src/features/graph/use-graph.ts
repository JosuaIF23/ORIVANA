import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { GraphQuery } from '@contracts/types';
import { getGraph, getRelationship, listRelationships, reviewRelationship } from '@/services/graph';
import { qk } from '@/hooks/query-keys';

export function useGraph(query: GraphQuery) {
  return useQuery({ queryKey: qk.graph(query), queryFn: () => getGraph(query), placeholderData: keepPreviousData });
}

export function useRelationships() {
  return useQuery({ queryKey: qk.relationships, queryFn: listRelationships });
}

export function useRelationship(id: string | null) {
  return useQuery({ queryKey: qk.relationship(id ?? ''), queryFn: () => getRelationship(id!), enabled: Boolean(id) });
}

export function useReviewRelationship() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: 'confirmed' | 'rejected' }) => reviewRelationship(id, status),
    onSuccess: (rel) => {
      queryClient.setQueryData(qk.relationship(rel.id), rel);
      void queryClient.invalidateQueries({ queryKey: qk.graphAll });
      void queryClient.invalidateQueries({ queryKey: qk.relationships });
      void queryClient.invalidateQueries({ queryKey: qk.suggestions });
      void queryClient.invalidateQueries({ queryKey: qk.auditAll });
    },
  });
}
