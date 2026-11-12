/**
 * The only module that imports fixture JSON. Everything else reads fixtures
 * through the mock store (store.ts) or the lazy loaders below.
 */
import type {
  ActionProposal,
  ApproveProposalResponse,
  AuditListResponse,
  ConnectionsResponse,
  ConversationDetail,
  DeletionPreview,
  ErrorResponse,
  ExportsResponse,
  DataExport,
  GraphResponse,
  LoginResponse,
  MeResponse,
  MemoryListResponse,
  Preferences,
  ProjectDetail,
  ProposalListResponse,
  RecordedStream,
  RegisterResponse,
  RelationshipDetail,
  SearchResponse,
  Session,
  Source,
  SourceDetail,
  SourceListResponse,
  SourcePageResponse,
  SuggestionsResponse,
  UploadSourceResponse,
  Page,
  Memory,
  Project,
  MatrixResponse,
  MatrixCellDetail,
  ClaimDetail,
  ClaimListResponse,
  DecisionAlert,
  DecisionAlertListResponse,
  ModelsResponse,
  ZoteroCollectionsResponse,
  ZoteroSyncResponse,
  StartConnectionResponse,
  ToolConnection,
} from '@contracts/types';

import testAccounts from '@contracts/fixtures/auth/_test-accounts.json';
import loginOk from '@contracts/fixtures/auth/login.200.json';
import loginNewUser from '@contracts/fixtures/auth/login.200.new-user.json';
import loginInvalid from '@contracts/fixtures/auth/login.401-invalid-credentials.json';
import loginUnverified from '@contracts/fixtures/auth/login.403-email-not-verified.json';
import loginRateLimited from '@contracts/fixtures/auth/login.429-rate-limited.json';
import registerOk from '@contracts/fixtures/auth/register.201.json';
import registerTaken from '@contracts/fixtures/auth/register.409-email-taken.json';
import registerWeak from '@contracts/fixtures/auth/register.422-weak-password.json';
import verifyOk from '@contracts/fixtures/auth/verify-email.200.json';
import verifyExpired from '@contracts/fixtures/auth/verify-email.410-expired.json';
import resendOk from '@contracts/fixtures/auth/resend-verification.200.json';
import forgotOk from '@contracts/fixtures/auth/forgot-password.200.json';
import forgotRateLimited from '@contracts/fixtures/auth/forgot-password.429-rate-limited.json';
import resetOk from '@contracts/fixtures/auth/reset-password.200.json';
import resetExpired from '@contracts/fixtures/auth/reset-password.410-expired.json';
import meOk from '@contracts/fixtures/me/get.200.json';
import meNewUser from '@contracts/fixtures/me/get.new-user.200.json';
import meUnauthenticated from '@contracts/fixtures/me/get.401-unauthenticated.json';
import preferences from '@contracts/fixtures/me/preferences.200.json';
import sessions from '@contracts/fixtures/me/sessions.200.json';
import projectsList from '@contracts/fixtures/projects/list.200.json';
import projectsDetail from '@contracts/fixtures/projects/detail.200.json';
import projectCreate from '@contracts/fixtures/projects/create.201.json';
import projectNotFound from '@contracts/fixtures/projects/get.404.json';
import sourcesList from '@contracts/fixtures/sources/list.200.json';
import sourcesRecent from '@contracts/fixtures/sources/list.recent.200.json';
import sourcesDetail from '@contracts/fixtures/sources/detail.200.json';
import sourceUpload from '@contracts/fixtures/sources/upload.201.json';
import sourceUploadTooLarge from '@contracts/fixtures/sources/upload.413-too-large.json';
import sourceNotFound from '@contracts/fixtures/sources/get.404.json';
import conversationsList from '@contracts/fixtures/conversations/list.200.json';
import conversationsDetail from '@contracts/fixtures/conversations/detail.200.json';
import conversationCreate from '@contracts/fixtures/conversations/create.201.json';
import graphSubgraph from '@contracts/fixtures/graph/subgraph.prj_rag.200.json';
import relationshipsDetail from '@contracts/fixtures/relationships/detail.200.json';
import relationshipConflict from '@contracts/fixtures/relationships/patch.409-already-decided.json';
import memoriesList from '@contracts/fixtures/memories/list.200.json';
import decisionsList from '@contracts/fixtures/memories/decisions.200.json';
import memoryInvalid from '@contracts/fixtures/memories/patch.422-invalid.json';
import proposalsPending from '@contracts/fixtures/action-proposals/list.pending.200.json';
import proposalsDecided from '@contracts/fixtures/action-proposals/list.decided.200.json';
import proposalApprove from '@contracts/fixtures/action-proposals/approve.200.json';
import proposalSucceeded from '@contracts/fixtures/action-proposals/get.succeeded.200.json';
import proposalNotValidated from '@contracts/fixtures/action-proposals/approve.422-not-validated.json';
import proposalRevisionConflict from '@contracts/fixtures/action-proposals/patch.409-revision.json';
import connectionsList from '@contracts/fixtures/connections/list.200.json';
import connectionsNeedsReconnect from '@contracts/fixtures/connections/list.needs-reconnect.200.json';
import auditList from '@contracts/fixtures/audit-events/list.200.json';
import searchHybrid from '@contracts/fixtures/search/hybrid.200.json';
import exportsList from '@contracts/fixtures/exports/list.200.json';
import exportCreate from '@contracts/fixtures/exports/create.202.json';
import exportReady from '@contracts/fixtures/exports/get.200.json';
import deletionPreview from '@contracts/fixtures/workspaces/deletion-preview.200.json';
import deleteConfirmation from '@contracts/fixtures/workspaces/delete-data.422-confirmation.json';
import suggestions from '@contracts/fixtures/home/suggestions.200.json';
import internalError from '@contracts/fixtures/_errors/500-internal.json';
import matrixRag from '@contracts/fixtures/knowledge/matrix.prj_rag.200.json';
import matrixCells from '@contracts/fixtures/knowledge/matrix-cells.200.json';
import claimsList from '@contracts/fixtures/claims/list.200.json';
import claimsDetail from '@contracts/fixtures/claims/detail.200.json';
import claimConflict from '@contracts/fixtures/claims/patch.409-already-decided.json';
import alertsOpen from '@contracts/fixtures/decision-alerts/list.open.200.json';
import alertNoteRequired from '@contracts/fixtures/decision-alerts/patch.422-note-required.json';
import alertProposal from '@contracts/fixtures/action-proposals/get.prop_01JCD04ALT.200.json';
import models from '@contracts/fixtures/models/list.200.json';
import zoteroCollections from '@contracts/fixtures/connections/zotero.collections.200.json';
import zoteroSync from '@contracts/fixtures/connections/zotero.sync.202.json';
import zoteroSyncRunning from '@contracts/fixtures/connections/zotero.sync.409-running.json';
import zoteroStart from '@contracts/fixtures/connections/zotero.start.200.json';
import zoteroCallback from '@contracts/fixtures/connections/zotero.callback.200.json';

/** JSON imports widen string unions to `string`; this cast restores the contract type. */
function as<T>(value: unknown): T {
  return value as T;
}

export interface TestAccount {
  email: string;
  password: string;
  scenario: 'returning_user' | 'new_user' | 'email_not_verified';
}

export const fixtures = {
  auth: {
    accounts: as<{ accounts: TestAccount[]; tokens: Record<'verify_valid' | 'reset_valid' | 'reset_expired', string> }>(testAccounts),
    loginOk: as<LoginResponse>(loginOk),
    loginNewUser: as<LoginResponse>(loginNewUser),
    loginInvalid: as<ErrorResponse>(loginInvalid),
    loginUnverified: as<ErrorResponse>(loginUnverified),
    loginRateLimited: as<ErrorResponse>(loginRateLimited),
    registerOk: as<RegisterResponse>(registerOk),
    registerTaken: as<ErrorResponse>(registerTaken),
    registerWeak: as<ErrorResponse>(registerWeak),
    verifyOk: as<LoginResponse>(verifyOk),
    verifyExpired: as<ErrorResponse>(verifyExpired),
    resendOk: as<{ sent_to: string; resend_available_at: string }>(resendOk),
    forgotOk: as<{ sent_to: string; expires_in_minutes: number }>(forgotOk),
    forgotRateLimited: as<ErrorResponse>(forgotRateLimited),
    resetOk: as<LoginResponse>(resetOk),
    resetExpired: as<ErrorResponse>(resetExpired),
  },
  me: {
    ok: as<MeResponse>(meOk),
    newUser: as<MeResponse>(meNewUser),
    unauthenticated: as<ErrorResponse>(meUnauthenticated),
    preferences: as<Preferences>(preferences),
    sessions: as<Page<Session>>(sessions),
  },
  projects: {
    list: as<Page<Project>>(projectsList),
    detail: as<{ items: Record<string, ProjectDetail> }>(projectsDetail),
    create: as<Project>(projectCreate),
    notFound: as<ErrorResponse>(projectNotFound),
  },
  sources: {
    list: as<SourceListResponse>(sourcesList),
    recent: as<SourceListResponse>(sourcesRecent),
    detail: as<{ items: Record<string, SourceDetail> }>(sourcesDetail),
    upload: as<UploadSourceResponse>(sourceUpload),
    uploadTooLarge: as<ErrorResponse>(sourceUploadTooLarge),
    notFound: as<ErrorResponse>(sourceNotFound),
  },
  conversations: {
    list: as<Page<ConversationDetail>>(conversationsList),
    detail: as<{ items: Record<string, ConversationDetail> }>(conversationsDetail),
    create: as<ConversationDetail>(conversationCreate),
  },
  graph: {
    subgraph: as<GraphResponse>(graphSubgraph),
    relationships: as<{ items: Record<string, RelationshipDetail> }>(relationshipsDetail),
    conflict: as<ErrorResponse>(relationshipConflict),
  },
  memories: {
    list: as<MemoryListResponse>(memoriesList),
    decisions: as<MemoryListResponse & { items: Memory[] }>(decisionsList),
    invalid: as<ErrorResponse>(memoryInvalid),
  },
  proposals: {
    pending: as<ProposalListResponse>(proposalsPending),
    decided: as<ProposalListResponse>(proposalsDecided),
    approve: as<ApproveProposalResponse>(proposalApprove),
    succeeded: as<ActionProposal>(proposalSucceeded),
    notValidated: as<ErrorResponse>(proposalNotValidated),
    revisionConflict: as<ErrorResponse>(proposalRevisionConflict),
  },
  connections: {
    list: as<ConnectionsResponse>(connectionsList),
    needsReconnect: as<ConnectionsResponse>(connectionsNeedsReconnect),
  },
  audit: as<AuditListResponse>(auditList),
  search: { hybrid: as<SearchResponse>(searchHybrid) },
  exports: { list: as<ExportsResponse>(exportsList), create: as<DataExport>(exportCreate), ready: as<DataExport>(exportReady) },
  workspace: { deletionPreview: as<DeletionPreview>(deletionPreview), deleteConfirmation: as<ErrorResponse>(deleteConfirmation) },
  home: { suggestions: as<SuggestionsResponse>(suggestions) },
  errors: { internal: as<ErrorResponse>(internalError) },
  /* v2 */
  knowledge: {
    matrix: as<MatrixResponse>(matrixRag),
    cells: as<{ items: MatrixCellDetail[] }>(matrixCells),
  },
  claims: {
    list: as<ClaimListResponse>(claimsList),
    detail: as<{ items: Record<string, ClaimDetail> }>(claimsDetail),
    conflict: as<ErrorResponse>(claimConflict),
  },
  alerts: {
    open: as<DecisionAlertListResponse & { items: DecisionAlert[] }>(alertsOpen),
    noteRequired: as<ErrorResponse>(alertNoteRequired),
    proposal: as<ActionProposal>(alertProposal),
  },
  models: as<ModelsResponse>(models),
  zotero: {
    collections: as<ZoteroCollectionsResponse>(zoteroCollections),
    sync: as<ZoteroSyncResponse>(zoteroSync),
    syncRunning: as<ErrorResponse>(zoteroSyncRunning),
    start: as<StartConnectionResponse>(zoteroStart),
    callback: as<ToolConnection>(zoteroCallback),
  },
};

// Page content and SSE recordings are loaded on demand to keep the main bundle small.
const pageLoaders = import.meta.glob<{ pages: SourcePageResponse[] }>('../../../../../packages/contracts/fixtures/sources/chunks/*.json', { import: 'default' });
const streamLoaders = import.meta.glob<RecordedStream>('../../../../../packages/contracts/fixtures/streams/*.json', { import: 'default' });

export async function loadSourcePages(sourceId: string): Promise<SourcePageResponse[] | null> {
  const key = Object.keys(pageLoaders).find((path) => path.endsWith(`/${sourceId}.200.json`));
  if (!key) return null;
  const data = await pageLoaders[key]();
  return data.pages;
}

export type StreamScenario = 'answer.hybrid' | 'answer.onboarding' | 'no-evidence' | 'conflicting' | 'proposal.create-issue' | 'error.model-timeout';

export async function loadStream(scenario: StreamScenario): Promise<RecordedStream> {
  const key = Object.keys(streamLoaders).find((path) => path.endsWith(`/${scenario}.sse.json`));
  if (!key) throw new Error(`Missing stream fixture: ${scenario}`);
  return streamLoaders[key]();
}

export type { Source };
