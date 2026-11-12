import type { StreamEvent } from '@contracts/types';
import { latencyConfig } from './core/http';
import { endSession, startSession } from './core/store';
import { getMe, updatePreferences } from './auth';
import { getMatrix, getMatrixCell, reviewMatrixRelationship } from './matrix';
import { getClaim, listClaims, updateClaim } from './claims';
import { getDecisionAlert, listDecisionAlerts, proposeActionFromAlert, updateDecisionAlert } from './decision-alerts';
import { approveProposal, getProposal, listProposals } from './proposals';
import { createMemory, listMemories, setDependencies } from './memories';
import { listAuditEvents } from './audit';
import { connectZotero, getZoteroSync, listZoteroCollections, syncZotero } from './zotero';
import { keepRemovedZoteroItem, listSources } from './sources';
import { getModels } from './models';
import { sendMessage } from './conversations';
import { openMessageStream } from './stream';

const settle = () => new Promise((r) => setTimeout(r, 0));
async function flush(times = 40) {
  for (let i = 0; i < times; i++) await settle();
}

beforeAll(() => {
  latencyConfig.scale = 0;
});

beforeEach(() => {
  endSession();
  startSession('returning_user');
});

describe('matrix', () => {
  it('shows Hybrid × HotpotQA as a gap until candidates are included', async () => {
    const confirmed = await getMatrix({ project_id: 'prj_rag' });
    expect(confirmed.methods.map((m) => m.name)).toEqual(['BM25', 'Dense retrieval', 'Hybrid retrieval', 'GraphRAG']);
    expect(confirmed.papers.map((p) => `${p.ordinal} ${p.label}`)).toEqual(['1 Santos & Lee 2025', '2 Okafor et al. 2025', '3 Varga & Chen 2024', '4 Ito 2025']);
    const has = (r: typeof confirmed, m: string, d: string) => r.cells.find((c) => c.method_id === m && c.dataset_id === d);
    expect(has(confirmed, 'ent_m_hybrid', 'ent_d_hotpotqa')).toBeUndefined();
    expect(has(confirmed, 'ent_m_dense', 'ent_d_hotpotqa')?.paper_ordinals).toEqual([3]);
    expect(has(confirmed, 'ent_m_bm25', 'ent_d_nq')?.paper_ordinals).toEqual([1, 2]);
    expect(confirmed.gap_count).toBe(6);
    const all = await getMatrix({ project_id: 'prj_rag', include_candidates: true });
    expect(has(all, 'ent_m_hybrid', 'ent_d_hotpotqa')?.status).toBe('candidate');
    expect(all.gap_count).toBe(4);
  });

  it('opens cell evidence and confirming a candidate fills the cell', async () => {
    const gap = await getMatrixCell('ent_m_bm25', 'ent_d_hotpotqa');
    expect(gap.is_gap).toBe(true);
    const cell = await getMatrixCell('ent_m_hybrid', 'ent_d_hotpotqa');
    expect(cell.papers[0]).toMatchObject({ label: 'Varga & Chen 2024', status: 'candidate' });
    expect(cell.papers[0].evidence.length).toBeGreaterThan(0);
    await reviewMatrixRelationship('rel_varga_hybrid', 'confirmed');
    const after = await getMatrix({ project_id: 'prj_rag' });
    expect(after.cells.some((c) => c.method_id === 'ent_m_hybrid' && c.dataset_id === 'ent_d_hotpotqa' && c.status === 'confirmed')).toBe(true);
    await expect(reviewMatrixRelationship('rel_varga_hybrid', 'confirmed')).rejects.toMatchObject({ status: 409 });
  });
});

describe('claims', () => {
  it('lists the flagship claim first as most contested, with decision usage', async () => {
    const res = await listClaims({ project_id: 'prj_rag' });
    const top = res.items[0];
    expect(top).toMatchObject({ statement: 'Hybrid retrieval outperforms dense-only retrieval on open-domain QA', supports_count: 2, contradicts_count: 1, mentions_count: 3 });
    expect(top.used_by_decisions[0]).toMatchObject({ title: 'Use hybrid retrieval for thesis experiments', review_state: 'needs_review' });
    const detail = await getClaim(top.id);
    const contra = detail.evidence.find((e) => e.stance === 'contradicts');
    expect(contra).toMatchObject({ source_label: 'Varga & Chen 2024' });
    expect(contra?.evidence[0]).toMatchObject({ page: 9, section: '5 Discussion' });
    expect(detail.context_note?.generated_by).toBe('model');
  });

  it('confirms candidates, refuses re-review, and merges', async () => {
    await expect(updateClaim('ent_c_gapcloses', { op: 'confirm' })).resolves.toMatchObject({ status: 'confirmed' });
    await expect(updateClaim('ent_c_gapcloses', { op: 'reject' })).rejects.toMatchObject({ status: 409 });
    const merged = await updateClaim('ent_c_fusionnq', { op: 'merge', into_claim_id: 'ent_c_hybridbeats' });
    expect(merged.id).toBe('ent_c_hybridbeats');
    expect((await listClaims()).items.some((c) => c.id === 'ent_c_fusionnq')).toBe(false);
  });
});

describe('decision impact', () => {
  it('raises one open alert that drives the Home badge', async () => {
    const me = await getMe();
    expect(me.counts.decisions_needing_review).toBe(1);
    const alerts = await listDecisionAlerts({ status: 'open' });
    expect(alerts.items).toHaveLength(1);
    expect(alerts.items[0]).toMatchObject({ decision_title: 'Use hybrid retrieval for thesis experiments', severity: 'weakens', trigger_source_label: 'Varga & Chen 2024' });
    expect(alerts.items[0].new_evidence[0].passage).toMatchObject({ page: 9 });
    expect(alerts.items[0].previous_evidence.map((e) => e.source_label)).toEqual(['Santos & Lee 2025', 'Okafor et al. 2025']);
    const review = await listMemories({ decisions_only: true, review_state: 'needs_review' });
    expect(review.items.map((d) => d.id)).toEqual(['dec_rag_04']);
  });

  it('propose action creates a pending proposal with its origin, and approving links it back', async () => {
    const { proposal_id } = await proposeActionFromAlert('alert_01JCD04VRG');
    const again = await proposeActionFromAlert('alert_01JCD04VRG');
    expect(again.proposal_id).toBe(proposal_id);
    const pending = await listProposals('pending');
    expect(pending.counts.pending).toBe(3);
    const proposal = await getProposal(proposal_id);
    expect(proposal.arguments.title).toBe('Re-evaluate retrieval choice for multi-hop questions');
    expect(proposal.origin).toMatchObject({ type: 'decision_alert', label: 'From Decision Impact alert: Use hybrid retrieval for thesis experiments' });
    expect(proposal.linked_decision?.code).toBe('D-04');
    const res = await approveProposal(proposal_id);
    expect(res.proposal.status).toBe('executing');
    await new Promise((r) => setTimeout(r, 20));
    await flush();
    const done = await getProposal(proposal_id);
    expect(done.status).toBe('succeeded');
    expect(done.latest_run?.verified_at).toBeTruthy();
    const decisions = await listMemories({ decisions_only: true });
    const d04 = decisions.items.find((d) => d.id === 'dec_rag_04');
    expect(d04?.history?.at(-1)?.text).toMatch(/created and verified/);
    const events = await listAuditEvents({ categories: ['proposals'] });
    expect(events.items[0].summary).toMatch(/Decision Impact alert/);
  });

  it('keep requires a note and clears the review state', async () => {
    await expect(updateDecisionAlert('alert_01JCD04VRG', { status: 'dismissed', resolution_note: ' ' })).rejects.toMatchObject({ status: 422 });
    const kept = await updateDecisionAlert('alert_01JCD04VRG', { status: 'dismissed', resolution_note: 'Multi-hop is out of scope for Chapter 4.' });
    expect(kept.resolution).toMatchObject({ kind: 'kept' });
    expect((await getMe()).counts.decisions_needing_review).toBe(0);
    await expect(updateDecisionAlert('alert_01JCD04VRG', { status: 'dismissed', resolution_note: 'again' })).rejects.toMatchObject({ status: 409 });
  });

  it('revise supersedes the old decision and resolves the alert', async () => {
    const revised = await createMemory({ kind: 'decision', memory_type: 'project', project_id: 'prj_rag', title: 'Use hybrid retrieval for single-hop experiments only', content: 'Use hybrid for NQ and TriviaQA; dense-only for HotpotQA.', status: 'confirmed', dependencies: ['ent_c_hybridbeats', 'ent_c_gapcloses'], supersedes_id: 'dec_rag_04' });
    expect(revised.decision?.code).toBe('D-06');
    const alert = await updateDecisionAlert('alert_01JCD04VRG', { status: 'resolved', replacement_memory_id: revised.id });
    expect(alert.resolution?.replacement_memory_id).toBe(revised.id);
    const decisions = await listMemories({ decisions_only: true });
    expect(decisions.items.find((d) => d.id === 'dec_rag_04')).toMatchObject({ status: 'superseded', superseded_by_id: revised.id, review_state: 'ok' });
    expect((await getDecisionAlert(alert.id)).status).toBe('resolved');
    const claim = await getClaim('ent_c_gapcloses');
    expect(claim.used_by_decisions.some((d) => d.id === revised.id)).toBe(true);
  });

  it('confirming a decision needs evidence or a claim', async () => {
    await expect(createMemory({ kind: 'decision', memory_type: 'project', project_id: 'prj_rag', title: 'No evidence', content: '', status: 'confirmed' })).rejects.toMatchObject({ status: 422 });
    const d = await createMemory({ kind: 'decision', memory_type: 'project', project_id: 'prj_rag', title: 'Saved from an answer', content: 'x', status: 'proposed', from_message_id: 'msg_hybrid_a1' });
    const linked = await setDependencies(d.id, ['ent_c_lexicalaids']);
    expect(linked.dependencies?.[0].statement).toMatch(/rare entity names/);
  });
});

describe('zotero and models', () => {
  it('lists collections, flags removed items, and keeps them on request', async () => {
    const res = await listZoteroCollections();
    expect(res.collections.find((c) => c.key === 'ZC7K2RAG')?.synced_project_id).toBe('prj_rag');
    const removed = await listSources({ removed_in_zotero: true });
    expect(removed.items.map((s) => s.title)).toEqual(['Sparse–Dense Hybrids in Low-Resource Domains']);
    const kept = await keepRemovedZoteroItem(removed.items[0].id);
    expect(kept.zotero?.removed_in_zotero).toBe(false);
    const varga = (await listSources({ q: 'Dense-Only Baselines' })).items[0];
    expect(varga).toMatchObject({ type: 'zotero', zotero: { collection_name: 'RAG Comparison' } });
  });

  it('a new user connects Zotero (read only) and imports a collection', async () => {
    endSession();
    startSession('new_user');
    await expect(listZoteroCollections()).rejects.toMatchObject({ status: 409 });
    const connection = await connectZotero();
    expect(connection.grant.scopes.some((s) => s.kind === 'write_with_approval')).toBe(false);
    const sync = await syncZotero({ collection_keys: ['ZC9T4THS'], project_id: null });
    expect(sync).toMatchObject({ status: 'running', counts: { items: 9, with_pdf: 8 } });
    await new Promise((r) => setTimeout(r, 30));
    await flush(80);
    expect((await getZoteroSync(sync.sync_id)).status).toBe('succeeded');
    expect((await listSources()).items.every((s) => s.type === 'zotero')).toBe(true);
  });

  it('answers record the chosen model', async () => {
    const models = await getModels();
    expect(models.answer_models.find((m) => m.is_default)?.name).toBe('Claude Sonnet 5.5');
    await updatePreferences({ answer_model: 'gpt-5-mini' });
    const sent = await sendMessage('conv_hybrid', { content: 'Which papers report that hybrid retrieval beats dense-only?', project_id: 'prj_rag' });
    const events: StreamEvent[] = [];
    await new Promise<void>((resolve) => {
      openMessageStream('conv_hybrid', sent.message_id, (e) => {
        events.push(e);
        if (e.event === 'done' || e.event === 'error') resolve();
      });
    });
    const done = events.at(-1);
    expect(done?.event === 'done' && done.data.message.model_name).toBe('GPT-5 mini');
  });
});
