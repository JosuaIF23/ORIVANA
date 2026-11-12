import { useEffect } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { ZoteroSyncRequest } from '@contracts/types';
import { connectZotero, getZoteroSync, listZoteroCollections, syncZotero } from '@/services/zotero';
import { keepRemovedZoteroItem } from '@/services/sources';
import { useConnectionsList } from '@/hooks/use-data';
import { qk } from '@/hooks/query-keys';

/** The Zotero connection, if any (read only). */
export function useZoteroConnection() {
  const query = useConnectionsList();
  return { ...query, connection: query.data?.connections.find((c) => c.provider === 'zotero') ?? null };
}

export function useZoteroCollections(enabled: boolean) {
  return useQuery({ queryKey: qk.zoteroCollections, queryFn: listZoteroCollections, enabled });
}

export function useConnectZotero() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: connectZotero,
    onSuccess: () => {
      for (const key of [qk.connections, qk.zoteroCollections, qk.auditAll]) void queryClient.invalidateQueries({ queryKey: key });
    },
  });
}

export function useSyncZotero() {
  return useMutation({ mutationFn: (request: ZoteroSyncRequest) => syncZotero(request) });
}

/** Polls a sync until it finishes, then refreshes everything it touched (once). */
export function useZoteroSync(id: string | null) {
  const queryClient = useQueryClient();
  const query = useQuery({
    queryKey: qk.zoteroSync(id ?? ''),
    enabled: Boolean(id),
    queryFn: () => getZoteroSync(id!),
    refetchInterval: (q) => (q.state.data && (q.state.data.status === 'succeeded' || q.state.data.status === 'failed') ? false : 600),
  });
  const finished = query.data?.status === 'succeeded' || query.data?.status === 'failed';
  useEffect(() => {
    if (!finished) return;
    for (const key of [qk.sourcesAll, qk.me, qk.projects, qk.connections, qk.zoteroCollections, qk.auditAll]) void queryClient.invalidateQueries({ queryKey: key });
  }, [finished, queryClient]);
  return query;
}

export function useKeepRemovedItem() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: keepRemovedZoteroItem,
    onSuccess: () => {
      for (const key of [qk.sourcesAll, qk.auditAll]) void queryClient.invalidateQueries({ queryKey: key });
    },
  });
}
