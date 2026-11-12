import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { SourceListQuery, UploadSourceRequest } from '@contracts/types';
import { deleteSource, getSource, getSourcePage, isProcessing, listRecentSources, listSources, reprocessSource, uploadSource } from '@/services/sources';
import { qk } from '@/hooks/query-keys';

const POLL_MS = 800;

export function useSources(query: SourceListQuery) {
  return useQuery({
    queryKey: qk.sources(query),
    queryFn: () => listSources(query),
    placeholderData: keepPreviousData,
    refetchInterval: (q) => (q.state.data && isProcessing(q.state.data.items) ? POLL_MS * 2 : false),
  });
}

export function useRecentSources() {
  return useQuery({
    queryKey: qk.recentSources,
    queryFn: listRecentSources,
    refetchInterval: (q) => (q.state.data && isProcessing(q.state.data) ? POLL_MS * 2 : false),
  });
}

/** Source detail; polls while the source is processing. */
export function useSource(id: string | null | undefined) {
  return useQuery({
    queryKey: qk.source(id ?? 'none'),
    queryFn: () => getSource(id!),
    enabled: Boolean(id),
    retry: 1,
    refetchInterval: (q) => (q.state.data && isProcessing([q.state.data]) ? POLL_MS : false),
  });
}

export function useSourcePage(id: string, page: number) {
  return useQuery({ queryKey: qk.sourcePage(id, page), queryFn: () => getSourcePage(id, page), retry: false, placeholderData: keepPreviousData });
}

export function useUploadSource() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (req: UploadSourceRequest) => uploadSource(req),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: qk.sourcesAll });
      void queryClient.invalidateQueries({ queryKey: qk.me });
      void queryClient.invalidateQueries({ queryKey: qk.projects });
    },
  });
}

export function useReprocessSource() {
  const queryClient = useQueryClient();
  return useMutation({ mutationFn: reprocessSource, onSuccess: () => queryClient.invalidateQueries({ queryKey: qk.sourcesAll }) });
}

export function useDeleteSource() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteSource,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: qk.sourcesAll });
      void queryClient.invalidateQueries({ queryKey: qk.conversations });
      void queryClient.invalidateQueries({ queryKey: qk.graphAll });
      void queryClient.invalidateQueries({ queryKey: qk.me });
    },
  });
}
