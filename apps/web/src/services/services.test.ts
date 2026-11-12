import type { StreamEvent } from '@contracts/types';
import { latencyConfig, isApiError } from './core/http';
import { endSession, startSession } from './core/store';
import { getMe, login } from './auth';
import { approveProposal, getProposal, listProposals, rejectProposal, updateProposal } from './proposals';
import { listMemories, updateMemory } from './memories';
import { getGraph, reviewRelationship } from './graph';
import { deleteSource, getSourcePage, listSources } from './sources';
import { getConversation, sendMessage } from './conversations';
import { openMessageStream } from './stream';
import { search } from './search';
import { listAuditEvents } from './audit';

const settle = () => new Promise((r) => setTimeout(r, 0));

async function flush(times = 30) {
  for (let i = 0; i < times; i++) await settle();
}

beforeAll(() => {
  latencyConfig.scale = 0;
});

beforeEach(() => {
  endSession();
  startSession('returning_user');
});

describe('auth', () => {
  it('rejects a wrong password with attempts left', async () => {
    endSession();
    await expect(login({ email: 'josua@example.edu', password: 'nope' })).rejects.toMatchObject({ error: { code: 'INVALID_CREDENTIALS', details: { attempts_left: 3 } } });
  });

  it('reports an unverified email', async () => {
    const err = await login({ email: 'unverified@example.edu', password: 'correct horse battery' }).catch((e) => e);
    expect(isApiError(err) && err.error.code).toBe('EMAIL_NOT_VERIFIED');
  });

  it('starts a returning session with design counts', async () => {
    endSession();
    await login({ email: 'josua@example.edu', password: 'correct horse battery' });
    const me = await getMe();
    expect(me.counts).toMatchObject({ sources: 31, pending_approvals: 2, memories_needing_review: 3 });
  });

  it('returns 401 when signed out', async () => {
    endSession();
    await expect(getMe()).rejects.toMatchObject({ status: 401 });
  });
});

describe('approvals lifecycle', () => {
  it('approve → executing → succeeded with verification', async () => {
    const res = await approveProposal('prop_01JC9X4M7Q');
    expect(res.proposal.status).toBe('executing');
    await flush();
    const done = await getProposal('prop_01JC9X4M7Q');
    expect(done.status).toBe('succeeded');
    expect(done.latest_run?.verified_at).toBeTruthy();
    expect(done.latest_run?.external_ref).toBe('lab/rag-experiments#42');
    const lists = await listProposals('pending');
    expect(lists.counts.pending).toBe(1);
  });

  it('editing with an unknown label returns to Draft and blocks approval', async () => {
    const p = await getProposal('prop_01JC9X4M7Q');
    const edited = await updateProposal(p.id, { ...p.arguments, labels: [...p.arguments.labels, 'needs-triage'] }, p.revision);
    expect(edited.status).toBe('draft');
    expect(edited.validation.issues[0].field).toBe('labels');
    await expect(approveProposal(p.id)).rejects.toMatchObject({ error: { code: 'VALIDATION_FAILED' } });
    const fixed = await updateProposal(p.id, { ...edited.arguments, labels: ['evaluation'] }, edited.revision);
    expect(fixed.status).toBe('awaiting_approval');
  });

  it('reject records the reason', async () => {
    const rejected = await rejectProposal('prop_01JC8R2D1H', 'Not now');
    expect(rejected).toMatchObject({ status: 'rejected', reject_reason: 'Not now' });
  });
});

describe('memory', () => {
  it('needs_review lists candidates before confirmed', async () => {
    const res = await listMemories({ status: 'needs_review' });
    expect(res.items[0].status).toBe('candidate');
    expect(res.counts).toEqual({ candidate: 3, confirmed: 5, superseded: 1, rejected: 2 });
  });

  it('supersede links both records', async () => {
    const old = await updateMemory('mem_eval_set', { op: 'supersede', superseded_by_id: 'mem_chunking_384' });
    expect(old).toMatchObject({ status: 'superseded', superseded_by_id: 'mem_chunking_384' });
    await expect(updateMemory('mem_report_metrics', { op: 'supersede', superseded_by_id: 'mem_rerun_eval' })).rejects.toMatchObject({ status: 422 });
  });
});

describe('graph', () => {
  it('hides candidates unless asked and confirms them', async () => {
    const confirmedOnly = await getGraph({});
    expect(confirmedOnly.edges.every((e) => e.status === 'confirmed')).toBe(true);
    const all = await getGraph({ include_candidates: true });
    expect(all.nodes).toHaveLength(25);
    expect(all.edges).toHaveLength(30);
    await reviewRelationship('rel_varga_hybrid', 'confirmed');
    const after = await getGraph({ include_candidates: true });
    expect(after.counts.candidate).toBe(4);
    await expect(reviewRelationship('rel_varga_hybrid', 'rejected')).rejects.toMatchObject({ status: 409 });
  });
});

describe('sources', () => {
  it('paginates 8 at a time and filters by project', async () => {
    const all = await listSources({});
    expect(all).toMatchObject({ total: 31, workspace_total: 31 });
    expect(all.items).toHaveLength(8);
    const rag = await listSources({ project_id: 'prj_rag' });
    expect(rag.total).toBe(14);
  });

  it('serves the cited page and refuses processing sources', async () => {
    const page = await getSourcePage('src_okafor2025', 6);
    expect(page?.blocks.some((b) => b.type === 'table')).toBe(true);
    await expect(getSourcePage('src_meyer2024', 11)).rejects.toMatchObject({ error: { code: 'SOURCE_PROCESSING' } });
  });

  it('deleting a source removes its citations', async () => {
    const res = await deleteSource('src_santos2025');
    expect(res.removed.citations).toBeGreaterThan(0);
    const conv = await getConversation('conv_hybrid');
    expect(conv.messages[1].citations.some((c) => c.source_id === 'src_santos2025')).toBe(false);
  });
});

describe('assistant streaming', () => {
  it('streams status → token → citation → done and stores the answer', async () => {
    const { message_id, conversation_id } = await sendMessage('conv_hybrid', { content: 'Which datasets show hybrid gains?', project_id: 'prj_rag' });
    const events: StreamEvent['event'][] = [];
    openMessageStream(conversation_id, message_id, (e) => events.push(e.event));
    await flush(200);
    expect(events[0]).toBe('status');
    expect(events).toContain('token');
    expect(events.filter((e) => e === 'citation')).toHaveLength(3);
    expect(events.at(-1)).toBe('done');
    const conv = await getConversation('conv_hybrid');
    expect(conv.messages.at(-1)?.id).toBe(message_id);
  });

  it('a stream can be reopened (StrictMode remount / EventSource reconnect)', async () => {
    const { message_id, conversation_id } = await sendMessage(null, { content: 'Which papers report that hybrid retrieval beats dense-only?', project_id: 'prj_rag' });
    const first = openMessageStream(conversation_id, message_id, () => undefined);
    first.close();
    const events: StreamEvent['event'][] = [];
    openMessageStream(conversation_id, message_id, (e) => events.push(e.event));
    await flush(200);
    expect(events).not.toContain('error');
    expect(events.at(-1)).toBe('done');
  });

  it('issue requests link the existing pending proposal (idempotent)', async () => {
    const { message_id, conversation_id } = await sendMessage('conv_hybrid', { content: 'Create a GitHub issue for this', project_id: 'prj_rag' });
    let proposalId: string | null = null;
    openMessageStream(conversation_id, message_id, (e) => {
      if (e.event === 'done') proposalId = e.data.message.proposal_id;
    });
    await flush(200);
    expect(proposalId).toBe('prop_01JC9X4M7Q');
  });

  it('simulated model errors emit a retryable error', async () => {
    const { message_id, conversation_id } = await sendMessage('conv_hybrid', { content: 'simulate error please', project_id: 'prj_rag' });
    const errors: unknown[] = [];
    openMessageStream(conversation_id, message_id, (e) => e.event === 'error' && errors.push(e.data));
    await flush(200);
    expect(errors[0]).toMatchObject({ code: 'MODEL_TIMEOUT', retryable: true });
  });
});

describe('search and activity', () => {
  it('returns the grouped design results for "hybrid"', async () => {
    const res = await search({ query: 'hybrid' });
    expect(res.total).toBe(7);
    expect(res.groups.map((g) => g.key)).toContain('entities');
  });

  it('counts audit events per category', async () => {
    const res = await listAuditEvents({ since_days: 30 });
    expect(res.counts).toMatchObject({ ingestion: 14, retrieval: 11, memory: 6, tool_calls: 5, approvals: 4, external_actions: 3, errors: 3 });
    expect(res.items).toHaveLength(10);
  });
});
