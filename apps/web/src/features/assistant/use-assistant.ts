import { useEffect, useReducer } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { ErrorEventData, MessageCitation, StatusEventData } from '@contracts/types';
import { getConversation, retryMessage, sendFeedback, sendMessage } from '@/services/conversations';
import { cancelMessage, openMessageStream } from '@/services/stream';
import { qk } from '@/hooks/query-keys';

export function useConversation(id: string | undefined) {
  return useQuery({ queryKey: qk.conversation(id ?? ''), queryFn: () => getConversation(id!), enabled: Boolean(id) });
}

export interface LiveAnswer {
  messageId: string;
  status: StatusEventData | null;
  content: string;
  citations: MessageCitation[];
  error: ErrorEventData | null;
  finished: boolean;
}

type Action =
  | { type: 'reset'; messageId: string }
  | { type: 'status'; data: StatusEventData }
  | { type: 'token'; text: string }
  | { type: 'citation'; data: MessageCitation }
  | { type: 'error'; data: ErrorEventData }
  | { type: 'done' };

function reducer(state: LiveAnswer | null, action: Action): LiveAnswer | null {
  if (action.type === 'reset') return { messageId: action.messageId, status: null, content: '', citations: [], error: null, finished: false };
  if (!state) return state;
  switch (action.type) {
    case 'status':
      return { ...state, status: action.data };
    case 'token':
      return { ...state, content: state.content + action.text };
    case 'citation':
      return { ...state, citations: [...state.citations, action.data] };
    case 'error':
      return { ...state, error: action.data, finished: true };
    case 'done':
      return { ...state, finished: true };
  }
}

/**
 * Subscribes to the SSE stream for an assistant message (PRD §9.5) and keeps
 * the partial answer. On `done`/`error` the conversation query is refreshed
 * so the stored message replaces the live draft.
 */
export function useAnswerStream(conversationId: string | undefined, messageId: string | null) {
  const queryClient = useQueryClient();
  const [live, dispatch] = useReducer(reducer, null);

  useEffect(() => {
    if (!conversationId || !messageId) return;
    dispatch({ type: 'reset', messageId });
    const handle = openMessageStream(conversationId, messageId, (event) => {
      switch (event.event) {
        case 'status':
          dispatch({ type: 'status', data: event.data });
          break;
        case 'token':
          dispatch({ type: 'token', text: event.data.text });
          break;
        case 'citation':
          dispatch({ type: 'citation', data: event.data });
          break;
        case 'error':
          dispatch({ type: 'error', data: event.data });
          void queryClient.invalidateQueries({ queryKey: qk.conversation(conversationId) });
          break;
        case 'done':
          dispatch({ type: 'done' });
          void queryClient.invalidateQueries({ queryKey: qk.conversation(conversationId) });
          void queryClient.invalidateQueries({ queryKey: qk.conversations });
          void queryClient.invalidateQueries({ queryKey: qk.proposalsAll });
          void queryClient.invalidateQueries({ queryKey: qk.me });
          break;
      }
    });
    return () => handle.close();
  }, [conversationId, messageId, queryClient]);

  return live && live.messageId === messageId ? live : null;
}

export function useSendMessage() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ conversationId, content, projectId }: { conversationId: string | null; content: string; projectId: string | null }) => sendMessage(conversationId, { content, project_id: projectId }),
    onSuccess: (res) => {
      void queryClient.invalidateQueries({ queryKey: qk.conversation(res.conversation_id) });
      void queryClient.invalidateQueries({ queryKey: qk.conversations });
    },
  });
}

export function useCancelMessage() {
  return useMutation({ mutationFn: ({ conversationId, messageId }: { conversationId: string; messageId: string }) => cancelMessage(conversationId, messageId) });
}

export function useRetryMessage() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ conversationId, messageId }: { conversationId: string; messageId: string }) => retryMessage(conversationId, messageId),
    onSuccess: (_res, vars) => queryClient.invalidateQueries({ queryKey: qk.conversation(vars.conversationId) }),
  });
}

export function useFlagIncorrect() {
  return useMutation({ mutationFn: (messageId: string) => sendFeedback(messageId, { kind: 'incorrect' }) });
}
