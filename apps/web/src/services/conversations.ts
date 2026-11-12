import type {
  Conversation,
  ConversationDetail,
  CreateConversationRequest,
  Message,
  MessageFeedbackRequest,
  SendMessageRequest,
  SendMessageResponse,
} from '@contracts/types';
import { nowIso } from '@/lib/clock';
import { fixtures, type StreamScenario } from './core/fixtures';
import { failWith, simulate } from './core/http';
import { recordAudit, requireDb } from './core/session';
import { conversationSummary, type MockDb } from './core/store';

/** GET /api/v1/conversations */
export function listConversations(projectId?: string | null): Promise<Conversation[]> {
  return simulate(() => {
    const db = requireDb();
    return db.conversations
      .filter((c) => !projectId || c.project_id === projectId)
      .toSorted((a, b) => b.last_message_at.localeCompare(a.last_message_at))
      .map(conversationSummary);
  }, { ms: 260 });
}

/** GET /api/v1/conversations/{id} */
export function getConversation(id: string): Promise<ConversationDetail> {
  return simulate(() => findConversation(requireDb(), id), { ms: 280 });
}

function findConversation(db: MockDb, id: string): ConversationDetail {
  const conversation = db.conversations.find((c) => c.id === id);
  if (!conversation) failWith('NOT_FOUND', 'Conversation not found.');
  return conversation;
}

function scopeFor(db: MockDb, projectId: string | null) {
  const project = db.projects.find((p) => p.id === projectId);
  if (project) return { project_id: project.id, label: `Project ${project.name}`, source_count: db.sources.filter((s) => s.project_id === project.id).length };
  return { project_id: null, label: 'All of Personal workspace', source_count: db.sources.length };
}

/** POST /api/v1/conversations */
export function createConversation(request: CreateConversationRequest): Promise<ConversationDetail> {
  return simulate(() => createInDb(requireDb(), request), { ms: 250 });
}

function createInDb(db: MockDb, request: CreateConversationRequest): ConversationDetail {
  const project = db.projects.find((p) => p.id === request.project_id) ?? null;
  const template = structuredClone(fixtures.conversations.create);
  const created: ConversationDetail = {
    ...template,
    id: `conv_live_${db.conversations.length + 1}`,
    workspace_id: db.me.workspace.id,
    user_id: db.me.user.id,
    project_id: project?.id ?? null,
    project_name: project?.name ?? null,
    title: request.title ?? 'New conversation',
    created_at: nowIso(),
    last_message_at: nowIso(),
    messages: [],
    scope: scopeFor(db, project?.id ?? null),
  };
  db.conversations.unshift(created);
  if (project) project.counts.conversations += 1;
  return created;
}

// --- Streaming state --------------------------------------------------------------

interface PendingStream {
  conversationId: string;
  scenario: StreamScenario;
  question: string;
}

const pendingStreams = new Map<string, PendingStream>();

function pickScenario(db: MockDb, content: string): StreamScenario {
  const text = content.toLowerCase();
  if (/simulate error|timeout/.test(text)) return 'error.model-timeout';
  if (/learning rate|hyperparameter/.test(text)) return 'no-evidence';
  if (/\bissue\b/.test(text)) return 'proposal.create-issue';
  if (/chunk/.test(text)) return 'conflicting';
  if (db.scenario === 'new_user') return /hybrid|dense|dataset|retriev|beir|limitation/.test(text) ? 'answer.onboarding' : 'no-evidence';
  if (/hybrid|dense|bm25|dataset|retriev|rag|fusion/.test(text)) return 'answer.hybrid';
  return 'no-evidence';
}

let messageSeq = 0;

function newMessageId(prefix: string) {
  messageSeq += 1;
  return `msg_${prefix}_${Date.now().toString(36)}${messageSeq}`;
}

/**
 * POST /api/v1/conversations/{id}/messages — stores the user message and
 * returns the assistant `message_id` to open the SSE stream with (PRD §9.5).
 * Pass `conversationId = null` to start a new conversation first.
 */
export function sendMessage(conversationId: string | null, request: SendMessageRequest): Promise<SendMessageResponse & { conversation_id: string }> {
  return simulate(() => {
    const db = requireDb();
    const content = request.content.trim();
    if (!content) failWith('VALIDATION_FAILED', 'Type a question first.', { field: 'content' });
    const conversation = conversationId
      ? findConversation(db, conversationId)
      : createInDb(db, { project_id: request.project_id, title: content.length > 48 ? `${content.slice(0, 45)}…` : content });
    const userMessage: Message = {
      ...structuredClone(conversation.messages[0] ?? blankMessage()),
      id: newMessageId('u'),
      conversation_id: conversation.id,
      role: 'user',
      content,
      status: 'complete',
      created_at: nowIso(),
    };
    resetAssistantFields(userMessage);
    conversation.messages.push(userMessage);
    conversation.last_message_at = userMessage.created_at;
    const messageId = newMessageId('a');
    pendingStreams.set(messageId, { conversationId: conversation.id, scenario: pickScenario(db, content), question: content });
    return { user_message: userMessage, message_id: messageId, conversation_id: conversation.id };
  }, { ms: 300 });
}

function blankMessage(): Message {
  return {
    id: '',
    conversation_id: '',
    role: 'user',
    content: '',
    status: 'complete',
    created_at: nowIso(),
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
    error: null,
    cancelled_at: null,
  };
}

function resetAssistantFields(m: Message) {
  Object.assign(m, { answer_kind: null, sources_used: null, sources_searched: null, limitations: null, positions: null, inference: null, suggestion: null, related_entities: [], citations: [], proposal_id: null, error: null, cancelled_at: null });
}

/**
 * Internal: used by the SSE simulator in stream.ts. Like a real SSE endpoint,
 * the stream can be (re)opened until it finishes; reconnecting replays it.
 */
export function getPendingStream(messageId: string): PendingStream | undefined {
  return pendingStreams.get(messageId);
}

/** Internal: the stream finished (done, error, or cancelled). */
export function finishPendingStream(messageId: string) {
  pendingStreams.delete(messageId);
}

/** Internal: persists the final assistant message (done, cancelled, or error). */
export function storeAssistantMessage(conversationId: string, message: Message) {
  const db = requireDb();
  const conversation = findConversation(db, conversationId);
  conversation.messages = conversation.messages.filter((m) => m.id !== message.id);
  conversation.messages.push(message);
  conversation.last_message_at = message.created_at;
  if (message.status === 'complete' && message.answer_kind) {
    recordAudit(db, {
      actor_type: 'system',
      category: 'retrieval',
      event_type: 'retrieval.completed',
      target_type: 'conversation',
      target_id: conversationId,
      summary: `Retrieved passages from ${message.sources_searched ?? 0} sources; ${message.citations.length} cited in {link}`,
      link: { label: conversation.title, target_type: 'conversation', target_id: conversationId },
      result: 'succeeded',
    });
  }
}

/** Internal: retry re-runs generation only (the failed message is replaced). */
export function retryMessage(conversationId: string, failedMessageId: string): Promise<{ message_id: string }> {
  return simulate(() => {
    const db = requireDb();
    const conversation = findConversation(db, conversationId);
    const index = conversation.messages.findIndex((m) => m.id === failedMessageId);
    const question = conversation.messages.slice(0, index).reverse().find((m) => m.role === 'user')?.content ?? '';
    conversation.messages = conversation.messages.filter((m) => m.id !== failedMessageId);
    const messageId = newMessageId('a');
    const scenario = pickScenario(db, question.replace(/simulate error|timeout/gi, ''));
    pendingStreams.set(messageId, { conversationId, scenario: scenario === 'error.model-timeout' ? 'answer.hybrid' : scenario, question });
    return { message_id: messageId };
  }, { ms: 250 });
}

/** POST /api/v1/messages/{id}/feedback */
export function sendFeedback(messageId: string, request: MessageFeedbackRequest): Promise<{ id: string; message_id: string; kind: 'incorrect'; created_at: string }> {
  return simulate(() => {
    requireDb();
    return { id: `fb_${messageId.slice(-6)}`, message_id: messageId, kind: request.kind, created_at: nowIso() };
  });
}
