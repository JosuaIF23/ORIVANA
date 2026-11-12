/**
 * Simulated SSE for GET /api/v1/conversations/{id}/messages/{message_id}/stream.
 * Replays a recorded stream fixture with its delays, like EventSource would
 * deliver it (API-CONTRACT §5). Events: status, token, citation, done, error.
 */
import type { Message, MessageCitation, StreamEvent } from '@contracts/types';
import { nowIso } from '@/lib/clock';
import { loadStream } from './core/fixtures';
import { delay, nextRequestId, simulate } from './core/http';
import { requireDb } from './core/session';
import { storeAssistantMessage, takePendingStream } from './conversations';
import { ensureProposalFromChat } from './proposals';

export interface StreamHandle {
  close(): void;
}

interface Controller {
  cancelled: boolean;
  finish: () => void;
}

const live = new Map<string, Controller>();

function rewriteCitation(c: MessageCitation, messageId: string): MessageCitation {
  return { ...c, id: `cit_${messageId.slice(4)}_${c.ordinal}`, message_id: messageId };
}

export function openMessageStream(conversationId: string, messageId: string, onEvent: (event: StreamEvent) => void): StreamHandle {
  let closed = false;
  const emit = (event: StreamEvent) => {
    if (!closed) onEvent(event);
  };
  const pending = takePendingStream(messageId);
  const controller: Controller = { cancelled: false, finish: () => undefined };
  live.set(messageId, controller);

  void (async () => {
    if (!pending) {
      await delay(200);
      emit({ event: 'error', data: { code: 'NOT_FOUND', message: 'This answer is no longer streaming.', request_id: nextRequestId(), retryable: false } });
      return;
    }
    const db = requireDb();
    const conversation = db.conversations.find((c) => c.id === conversationId);
    const scope = conversation?.scope;
    const recording = await loadStream(pending.scenario);
    let content = '';
    const citations: MessageCitation[] = [];
    const startedAt = nowIso();

    controller.finish = () => {
      const base = recording.events.find((e) => e.event === 'done');
      const template = base?.event === 'done' ? base.data.message : undefined;
      const cancelled: Message = {
        ...(template ?? ({} as Message)),
        id: messageId,
        conversation_id: conversationId,
        role: 'assistant',
        content: content.trimEnd() + (content ? '…' : ''),
        status: 'cancelled',
        created_at: startedAt,
        citations,
        positions: null,
        inference: null,
        proposal_id: null,
        limitations: null,
        cancelled_at: nowIso(),
        error: null,
      };
      storeAssistantMessage(conversationId, cancelled);
      emit({ event: 'done', data: { message: cancelled } });
    };

    for (const recorded of recording.events) {
      await delay(recorded.delay_ms);
      if (controller.cancelled || closed) return;
      const { delay_ms: _d, ...event } = recorded;
      switch (event.event) {
        case 'status': {
          const steps = event.data.steps.map((s) =>
            s.label.startsWith('Scope resolved') && scope ? { ...s, label: `Scope resolved — ${scope.label} · ${scope.source_count} sources` } : s,
          );
          emit({ event: 'status', data: { ...event.data, steps } });
          break;
        }
        case 'token':
          content += event.data.text;
          emit(event);
          break;
        case 'citation': {
          const citation = rewriteCitation(event.data, messageId);
          citations.push(citation);
          emit({ event: 'citation', data: citation });
          break;
        }
        case 'done': {
          const message: Message = {
            ...event.data.message,
            id: messageId,
            conversation_id: conversationId,
            created_at: startedAt,
            citations: event.data.message.citations.map((c) => rewriteCitation(c, messageId)),
          };
          if (message.proposal_id) message.proposal_id = ensureProposalFromChat(db, conversationId, pending.question);
          storeAssistantMessage(conversationId, message);
          emit({ event: 'done', data: { message: structuredClone(message) } });
          break;
        }
        case 'error': {
          const failed: Message = {
            id: messageId,
            conversation_id: conversationId,
            role: 'assistant',
            content: '',
            status: 'error',
            created_at: startedAt,
            answer_kind: null,
            sources_used: null,
            sources_searched: null,
            limitations: null,
            positions: null,
            inference: null,
            suggestion: null,
            related_entities: [],
            citations: [],
            proposal_id: null,
            error: { code: event.data.code, message: event.data.message, retryable: event.data.retryable },
            cancelled_at: null,
          };
          storeAssistantMessage(conversationId, failed);
          emit({ event: 'error', data: { ...event.data, request_id: nextRequestId() } });
          break;
        }
      }
    }
    live.delete(messageId);
  })();

  return {
    close() {
      closed = true;
    },
  };
}

/** POST /api/v1/conversations/{id}/messages/{message_id}/cancel */
export function cancelMessage(_conversationId: string, messageId: string): Promise<{ message_id: string; status: 'cancelled' }> {
  return simulate(() => {
    const controller = live.get(messageId);
    if (controller && !controller.cancelled) {
      controller.cancelled = true;
      controller.finish();
      live.delete(messageId);
    }
    return { message_id: messageId, status: 'cancelled' as const };
  }, { ms: 150 });
}
