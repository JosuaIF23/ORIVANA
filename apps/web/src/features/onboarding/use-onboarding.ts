import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { getPreferences, updatePreferences, type UpdatePreferencesRequest } from '@/services/auth';
import { createProject, listProjects } from '@/services/projects';
import { connectGitHub, listConnections } from '@/services/connections';
import { sendMessage } from '@/services/conversations';
import { qk } from '@/hooks/query-keys';

export function usePreferences() {
  return useQuery({ queryKey: qk.preferences, queryFn: getPreferences });
}

export function useUpdatePreferences() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (patch: UpdatePreferencesRequest) => updatePreferences(patch),
    onSuccess: (prefs) => {
      queryClient.setQueryData(qk.preferences, prefs);
      void queryClient.invalidateQueries({ queryKey: qk.me });
    },
  });
}

export function useProjects() {
  return useQuery({ queryKey: qk.projects, queryFn: listProjects });
}

export function useCreateProject() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createProject,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: qk.projects });
      void queryClient.invalidateQueries({ queryKey: qk.preferences });
    },
  });
}

export function useConnections() {
  return useQuery({ queryKey: qk.connections, queryFn: listConnections });
}

export function useConnectGitHub() {
  const queryClient = useQueryClient();
  return useMutation({ mutationFn: connectGitHub, onSuccess: () => queryClient.invalidateQueries({ queryKey: qk.connections }) });
}

/** Starts a new conversation with the first question; returns ids to open the stream. */
export function useAskFirstQuestion() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ content, projectId }: { content: string; projectId: string | null }) => sendMessage(null, { content, project_id: projectId }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: qk.conversations }),
  });
}
