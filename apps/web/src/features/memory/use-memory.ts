import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { CreateMemoryRequest, MemoryListQuery, UpdateMemoryRequest } from '@contracts/types';
import { createMemory, deleteMemory, listMemories, updateMemory } from '@/services/memories';
import { qk } from '@/hooks/query-keys';

export function useMemories(query: MemoryListQuery) {
  return useQuery({ queryKey: qk.memories(query), queryFn: () => listMemories(query), placeholderData: keepPreviousData });
}

function useInvalidate() {
  const queryClient = useQueryClient();
  return () => {
    void queryClient.invalidateQueries({ queryKey: qk.memoriesAll });
    void queryClient.invalidateQueries({ queryKey: qk.me });
    void queryClient.invalidateQueries({ queryKey: qk.suggestions });
    void queryClient.invalidateQueries({ queryKey: qk.auditAll });
    void queryClient.invalidateQueries({ queryKey: qk.projects });
  };
}

export function useUpdateMemory() {
  const invalidate = useInvalidate();
  return useMutation({ mutationFn: ({ id, request }: { id: string; request: UpdateMemoryRequest }) => updateMemory(id, request), onSuccess: invalidate });
}

export function useCreateMemory() {
  const invalidate = useInvalidate();
  return useMutation({ mutationFn: (request: CreateMemoryRequest) => createMemory(request), onSuccess: invalidate });
}

export function useDeleteMemory() {
  const invalidate = useInvalidate();
  return useMutation({ mutationFn: deleteMemory, onSuccess: invalidate });
}
