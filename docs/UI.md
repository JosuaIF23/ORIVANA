# ORIVANA — UI/UX Design Specification

> Companion document to `PRD.md`\
> **Product:** ORIVANA\
> **Version:** 2.0 (12 November 2026)\
> **Design direction:** Professional research decision workspace\
> **Initial theme:** Dark-first, accessible light theme later\
> **Primary platform:** Desktop web, responsive tablet/mobile\
> **Initial persona:** Postgraduate researcher who uses Zotero and GitHub (PRD §4)

---

## 0. What changed in v2.0

| Area | Change |
|---|---|
| Positioning | Interface must lead with **decisions and evidence**, not with chat (PRD §1, §3) |
| Knowledge | Tabs are now **Sources · Matrix · Claims · Map · Memory** (Graph became Map) |
| New screens | Matrix, Claims, Decision Impact review, Zotero connect/import, Model preferences |
| Updated screens | Home (decisions needing review), Assistant (save as decision, model label), Sources (Zotero badge/import), Memory (review state), Project (alerts on timeline), Approvals (origin: alert), Integrations (Zotero, MCP card), Activity (new event types), Onboarding (Zotero first) |
| Unchanged | Tokens, shell, sign in/up, Map (former Graph), Approvals flow, Settings structure |

Existing artboards (35) remain valid. §9.2 lists the new and updated artboards.

---

## 1. Design objective

Design ORIVANA as a calm, trustworthy workspace where a researcher can **see their evidence, keep their decisions honest, and act with control**.

Within a few seconds, the interface must communicate:

1. What the user's papers say, with exact evidence.
2. What the user has decided, and whether those decisions still hold.
3. What the system proposes to do next, and that nothing happens without approval.

Do not make ORIVANA look like a generic chatbot, a crypto dashboard, a sci-fi control room, or a crowded analytics product. Chat is one tool among several, not the center of the product.

### 1.1 Experience principles

- Evidence is always one click away.
- Decisions are visible objects with status and history.
- Changes in evidence surface where decisions live.
- Actions have previews, permissions, and verified outcomes.
- The user can inspect, correct, or delete anything the system created.
- Complex views are progressively disclosed.
- Empty, loading, error, and permission states are designed with the same care as success states.

### 1.2 Brand identity

| Attribute | Value |
|---|---|
| Name | ORIVANA |
| Tagline | Your Knowledge, Connected. Your Intent, in Motion. |
| Category | Personal Intelligence & Action Platform |
| Visual metaphor | Connected knowledge paths converging into purposeful action |
| Logo direction | Simple custom symbol from connected paths or layered nodes; no brain, robot, or generic neural-network imagery |
| Wordmark | Uppercase ORIVANA, restrained geometric type |
| Voice | Clear, grounded, transparent about uncertainty |

Never describe the product as "autonomous". The name is not legally cleared.

---

## 2. Visual system

### 2.1 Personality

Intelligent · Calm · Precise · Trustworthy · Technical but approachable · Quietly futuristic

### 2.2 Design tokens (dark theme)

Contrast ratios calculated with the WCAG 2.x formula.

| Token | Value | Usage | Contrast notes |
|---|---|---|---|
| `bg-app` | `#0B0D12` | Main canvas | — |
| `bg-sidebar` | `#10141C` | Navigation, side panels | — |
| `bg-surface` | `#151B26` | Cards, panels | — |
| `bg-elevated` | `#1B2432` | Dialogs, popovers, hovered rows | — |
| `text-primary` | `#F3F6FA` | Main text | 14.4:1 on elevated |
| `text-secondary` | `#A5B0C0` | Supporting text | 7.1:1 on elevated |
| `text-muted` | `#8390A3` | Metadata | 4.8:1 on elevated |
| `accent-primary` | `#8B9CFF` | Primary actions, selection, focus ring | 6.2:1 as text on elevated |
| `on-accent` | `#0B0D12` | Text on primary buttons | 7.7:1 on accent |
| `accent-knowledge` | `#63D6C3` | Knowledge signals, supports, confirmed | 8.9:1 on elevated |
| `status-warning` | `#F2B96B` | Candidate, needs review, low-write risk | 8.9:1 on elevated |
| `status-danger` | `#F07878` | Contradicts, destructive, error | 5.7:1 on elevated |
| `border-subtle` | `#273142` | Dividers (decorative only) | 1.3:1 |
| `border-control` | `#64728A` | Inputs, checkboxes, selects | 3.2:1 on elevated |

### 2.3 Semantic mapping (new in v2)

| Meaning | Color token | Required non-color cue |
|---|---|---|
| Supports | `accent-knowledge` | ✓ icon + "Supports" label |
| Contradicts | `status-danger` | ✕ / opposing-arrows icon + "Contradicts" label |
| Mentions | `text-secondary` | "Mentions" label |
| Candidate (unconfirmed) | `status-warning` | Dashed border/line + "Candidate" label |
| Confirmed | `accent-knowledge` | Solid + "Confirmed" label |
| Superseded | `text-muted` | Strike-through + "Superseded" label |
| Needs review (Decision Impact) | `status-warning` | Alert-triangle icon + "Needs review" label |
| Gap (empty Matrix cell) | `border-subtle` dashed | "No evidence" text on hover/focus and in list view |

Rules:

- Primary buttons: `accent-primary` with `on-accent` text; never white on the accent.
- Filled warning/danger badges use `#0B0D12` text.
- Focus ring: 2 px `accent-primary`, 2 px offset.

### 2.4 Typography

- Inter (or Geist). Scale 12, 14, 16, 20, 24, 32 px.
- Body 14 px in workspaces; 16 px on reading surfaces (answers, document viewer).
- Tabular figures for counts and metrics (`font-variant-numeric: tabular-nums`).
- Monospace only for IDs, repository names, raw fields, logs.

### 2.5 Layout

- Desktop baseline 1440 × 900; 8 px grid.
- Sidebar 240 px, collapsible to a 64 px icon rail.
- Reading max width ~760 px.
- Right inspector 320–380 px.
- **Column budget:** at 1440 px never more than three full columns; screens needing four (Assistant) collapse the sidebar to the rail.

---

## 3. Application shell

### 3.1 Desktop structure

```text
┌──────────────────────────────────────────────────────────────────────────────┐
│ ORIVANA     Search anything... ⌘K                Help  Notifications  Avatar │
├───────────────┬──────────────────────────────────────┬───────────────────────┤
│ Workspace ▾   │ Main content                         │ Inspector             │
│               │                                      │                       │
│ Home      (1) │                                      │ Evidence              │
│ Assistant     │                                      │ Claim / cell details  │
│ Knowledge     │                                      │ Decision details      │
│ Projects      │                                      │ Action preview        │
│ Approvals (2) │                                      │                       │
│ Activity      │                                      │                       │
│ Integrations  │                                      │                       │
│               │                                      │                       │
│ Settings      │                                      │                       │
└───────────────┴──────────────────────────────────────┴───────────────────────┘
```

`(1)` on Home = number of decisions needing review. `(2)` on Approvals = pending proposals. Both are subtle numeric badges with accessible labels ("1 decision needs review").

### 3.2 Navigation (MVP)

| Item | Contains |
|---|---|
| Home | Ask box, decisions needing review, recent projects, recent sources, pending approvals, activity, connector health |
| Assistant | Conversations, cited answers, evidence panel |
| Knowledge | Tabs **Sources · Matrix · Claims · Map · Memory** |
| Projects | Project list and workspace |
| Approvals | Pending / decided proposals |
| Activity | Audit timeline |
| Integrations | Zotero, GitHub, "Use ORIVANA in Claude / ChatGPT" (post-MVP card) |
| Settings | Profile, security, model preferences, memory, export, deletion, notifications, appearance |

Automations appears only after Phase 4, between Approvals and Activity.

### 3.3 Global search

Grouped results by type: Sources, Claims, Methods/Datasets, Decisions, Conversations, Actions. Each row: type icon + label, title, project, modified date. `⌘K` / `Ctrl+K` opens; arrows navigate; Enter opens.

---

## 4. Screens

### 4.1 Landing (minimal for MVP)

1. Hero: "Your Knowledge, Connected. Your Intent, in Motion."
2. One line: "Keep your research decisions aligned with the evidence in your own papers."
3. Four-step visual: **Understand → Decide → Watch → Act**.
4. Screenshots: Matrix, Decision Impact alert, Approval.
5. Trust: evidence on every answer, approval before every action, export/delete anytime.
6. "Works with Zotero and GitHub."
7. CTA: Get started / Sign in.

Avoid "remembers everything", "autonomous", or comparisons naming competitors.

### 4.2 Sign up / Sign in / Verify / Reset

Unchanged from v1.1 (artboards exist): sign in (+ invalid credentials, email not verified), sign up, check email, reset password. Account sign-in is separate from connector authorization.

### 4.3 Onboarding (updated)

1. Welcome: one sentence on what ORIVANA does.
2. Use case: Research (preselected); others "coming later".
3. Create first project (optional).
4. **Add sources:** primary card "Connect Zotero (recommended)" → choose collections; secondary "Upload PDFs". Both skippable.
5. Ingestion progress with stages (Parsing → Indexing → Extracting) and a short explanation of what is extracted.
6. Privacy and memory controls.
7. First value: show either a suggested cited question **or** the first Matrix preview once extraction finishes.

### 4.4 Home / Command Center (updated)

Order of cards (top to bottom, left to right):

1. Greeting + "Ask your knowledge" input.
2. **Decisions needing review** (only when > 0): each row shows decision title, claim affected, new paper, severity ("Weakens" / "Uncertain"), and a "Review" button. Uses `status-warning` + alert icon.
3. Pending approvals.
4. Recent projects.
5. Recently added sources with status and source badge (PDF / Zotero).
6. Recent activity.
7. Connector health (Zotero last sync, GitHub status).

Empty state (new user): "Connect Zotero or upload your first paper" with both actions.

### 4.5 Assistant (updated)

Layout unchanged (icon rail 64 · conversations 280 · chat · evidence 360).

Additions:

- Under each answer: small label "Answered with <model name>".
- Answer actions: Copy · Open source · Explore in Claims · **Save as decision** · Flag incorrect.
- "Save as decision" opens a side sheet prefilled with the answer summary as statement, citations as evidence, and suggested claim dependencies; user edits rationale and saves as Proposed or Confirmed.
- When an answer touches a decision with `needs_review`, show an inline notice: "This relates to a decision that needs review" → link.

States unchanged: retrieving, generating, no evidence, conflicting sources, source inaccessible, model error, cancelled.

### 4.6 Knowledge → Sources (updated)

- Header actions: **Import from Zotero** (primary when connected) · Upload.
- Table columns: type badge (PDF, MD, TXT, **Zotero**), title, authors/year, project, status (Queued, Parsing, Indexing, Extracting, Ready, Failed), pages, added.
- Zotero rows show collection name and "Last synced".
- "Removed in Zotero" state with "Delete from ORIVANA" / "Keep" actions.
- Viewer unchanged: page navigation, section outline, highlighted passage, extracted entities, ingestion history, reprocess.

**Zotero import dialog**

1. If not connected: explain read-only access → Connect.
2. Choose collections (checkbox tree with item counts).
3. Choose target project.
4. Summary: "Import 34 items (31 with PDF). Nothing will be changed in Zotero." → Import.
5. Progress list; finishes with "View in Sources" / "Open Matrix".

### 4.7 Knowledge → Matrix (new)

**Goal:** show which methods were tested on which datasets in the user's collection, and where the gaps are.

Layout:

- Toolbar: project selector, year range, toggle "Include candidates", search methods/datasets, Export CSV.
- Main: grid table — rows = Methods, columns = Datasets.
- Right inspector (360 px): details of the selected cell.

Cell anatomy:

- Filled: count of papers (e.g. "2") + small citation chips `[1] [2]`; optional metric (e.g. "+3.6 top-20") when extracted. Candidate-only cells show a dashed border and "Candidate".
- Empty (gap): dashed outline, `—` glyph, accessible text "No evidence in your collection". Hover/focus shows "Gap" tooltip and (post-MVP) "Find papers for this gap".
- Selected: accent outline.

Inspector for a selected cell:

- Title: "Hybrid retrieval × HotpotQA".
- Papers with passages (page, section, quote highlighted).
- Status and confidence per relationship; Confirm / Reject.
- "Open in Claims" if related claims exist.

Example content:

```
                 Natural Questions   TriviaQA   HotpotQA   BEIR
BM25                  2 [1][2]         1 [2]       —        1 [2]
Dense retrieval       2 [1][2]         1 [2]      1 [3]     1 [2]
Hybrid                2 [1][2]         1 [2]       —        1 [2]
GraphRAG               —                —         1 [4]      —
```

Empty state: "Matrix fills in as papers are extracted. Import or upload papers to start."

Accessibility: real `<table>` with `<th scope="col">` / `<th scope="row">`; each cell is a button with label "Hybrid retrieval on HotpotQA: no evidence" or "…: 2 papers".

### 4.8 Knowledge → Claims (new)

**Goal:** show which claims are supported or contradicted in the user's collection, and which decisions depend on them.

Layout:

- Toolbar: project, sort (Most contested · Most supported · Used by decisions · Newest), filter (status, has contradictions).
- Main: list of claim cards.
- Right inspector: selected claim with evidence comparison.

Claim card:

- Statement (16 px).
- Counts: "✓ 2 Supports · ✕ 1 Contradicts · 3 Mentions".
- Status badge (Candidate / Confirmed).
- "Used by 1 decision" chip (links to Memory); warning icon if that decision needs review.

Inspector (Evidence comparison):

- Two columns: **Supports** | **Contradicts**, each with paper, page/section, highlighted quote.
- Note when evidence differs in context (e.g. "Contradiction is specific to multi-hop questions") — model-generated, labeled as such.
- Actions: Confirm claim · Merge with… · Reject · Open in Map.

Empty state: "No claims yet. Claims appear after extraction."

### 4.9 Knowledge → Map (formerly Graph)

Unchanged behavior from v1.1 (artboards exist), renamed to **Map**:

- Focused node-link graph (≤ ~150 nodes), filter panel, inspector, depth 1/2, List view toggle.
- Node types differ by icon and shape; candidate edges dashed with "Candidate" label.
- Mobile: list view by default.

Add: legend explaining edge types including Supports / Contradicts per §2.3.

### 4.10 Knowledge → Memory (updated)

Primary view: **Decisions**. Secondary filter for other memory types.

Columns / card fields: title, statement, project, status (Proposed, Confirmed, Superseded, Rejected), **review state** (Needs review badge), dependencies (claims), evidence count, decided date, origin.

Default filter order: Needs review → Proposed → Confirmed.

Actions: Confirm · Edit · Supersede (choose replacement) · Reject · Delete · View dependencies.

Decision detail side sheet:

- Statement and rationale.
- Dependencies (claims) with their current support/contradiction counts.
- Evidence passages.
- History (created, confirmed, superseded, alerts and resolutions).

### 4.11 Decision Impact review (new)

Opened from Home, Memory, Project timeline, or a notification.

Layout (full-width page with sidebar):

1. Header: decision title + "Needs review" badge + severity ("Weakens" / "Uncertain") + detected date.
2. Explanation line: "A new paper contradicts a claim this decision depends on."
3. Three-part body:
   - **Decision** (statement, rationale, date).
   - **Claim affected** (statement, previous support).
   - **Evidence comparison:** left "Supported by" (old passages), right "New contradicting evidence" (new passage highlighted, paper, page, section, imported date).
4. Model note (labeled "System assessment"): short reason why it may weaken the decision; confidence.
5. Action bar:
   - **Keep decision** (requires a short note) → alert dismissed, history updated.
   - **Revise decision** → opens editor; saving supersedes the old decision.
   - **Propose action** → creates a proposal (e.g. GitHub issue) and opens it in Approvals.

States: loading, alert already resolved (read-only with resolution note), evidence source deleted.

### 4.12 Project workspace (updated)

Tabs: Overview · Sources · Matrix · Claims · Decisions · Conversations · Actions · Activity.

Overview cards: description, status, **decisions needing review**, key confirmed decisions, recent sources, pending actions.

Decision timeline: superseded decisions struck through and linked to replacements; decisions with open alerts show the warning badge and "Review" link.

### 4.13 Approvals (updated)

Unchanged flow (Pending/Decided, review, Edit → Draft, Approve → Executing → Succeeded + Verified, Reject).

Additions:

- **Origin** field: "From Decision Impact alert: <decision title>" or "From conversation: <title>".
- Issue body preview includes evidence links (paper, page) and the decision link.
- After success: "Linked to decision" chip.

### 4.14 Integrations (updated)

Cards:

1. **Zotero** — Read only. Status, account, collections synced, last sync, "Sync now", "Manage collections", Revoke. Plain-language scope: "Read your items, PDFs, and highlights. ORIVANA never changes your Zotero library."
2. **GitHub** — Read + create issues. Status, account, repositories, scopes in plain language, Revoke.
3. **Use ORIVANA in Claude / ChatGPT** — "Coming later" card in MVP. Post-MVP: shows MCP server URL with copy button, connected clients, last call, revoke client, and the rule "Actions requested from other apps always wait for your approval here."
4. "Coming later": Obsidian, Google Drive, Notion.

### 4.15 Activity (updated)

Filters: Ingestion · Zotero sync · Retrieval · Extraction · Memory · **Decision alerts** · Proposals · Approvals · External actions · Errors (post-MVP: External clients / MCP).

Each event: actor (user / agent / system / external client), time, target, result, details.

### 4.16 Settings (updated)

Sections: Profile · Security & sessions · **Model preferences** · Memory controls · Data export · Data deletion · Notifications · Appearance.

**Model preferences:**

- "Answer model" radio list from `/api/v1/models` (e.g. Fast / Strong per provider), each with a one-line description.
- Read-only info: "Extraction and embeddings are managed by ORIVANA to keep your knowledge consistent."
- Note: "Changing the model affects new answers only."
- List of AI providers that may process your data (transparency).

### 4.17 Automations (post-MVP)

Hidden in MVP. Later: list (name, trigger, apps, last run, status) and a guided form (trigger → context → AI step → approval → action → verification). Example: "Weekly: check new Zotero items against my decisions."

---

## 5. Reusable components

Existing: AppShell · SidebarNavigation (rail) · WorkspaceSwitcher · GlobalSearch · CommandInput · SourceCard · SourceStatusBadge · DocumentViewer · CitationChip · EvidencePanel · GraphCanvas · GraphListView · EntityInspector · RelationshipEvidence · ProjectCard · DecisionTimeline · MemoryCard · StatusBadge · OriginBadge · ActionProposalCard · ApprovalDialog · IntegrationCard · PermissionScopeList · AgentRunTimeline · EmptyState · ErrorState · LoadingSkeleton · Toast/InlineAlert.

New in v2:

| Component | Purpose |
|---|---|
| MatrixGrid | Accessible table of Methods × Datasets |
| MatrixCell | Filled / candidate / gap / selected states |
| MatrixInspector | Evidence for a cell |
| ClaimCard | Statement, counts, status, decision usage |
| EvidenceCompare | Two-column Supports vs Contradicts (or old vs new) passages |
| ReviewStateBadge | "Needs review" with icon |
| DecisionAlertCard | Compact alert for Home/Project |
| DecisionImpactView | Full review page |
| SaveAsDecisionSheet | Create decision from an answer |
| SourceTypeBadge | PDF / MD / TXT / Zotero |
| ZoteroImportDialog | Connect, choose collections, import |
| ModelLabel | "Answered with …" |
| ModelPicker | Settings radio list |
| McpConnectCard | Post-MVP integration card |

All components: accessible names, visible focus, consistent loading/error states.

---

## 6. States and interaction rules

Every async operation: idle, loading, success, recoverable error, retry/cancel where applicable.

Every destructive action: explanation, confirmation, consequences (derived data removed), recovery info.

Every AI-generated object: origin (user, imported, model-proposed), evidence, status, and — for decisions — review state.

Never use color alone for status (see §2.3). Never show success before the backend (or mock service) confirms.

---

## 7. Responsive behavior

| Breakpoint | Behavior |
|---|---|
| Desktop ≥ 1280 px | Full shell; Assistant uses icon rail |
| Tablet 768–1279 px | Icon rail; inspector as overlay; Matrix scrolls horizontally with sticky first column |
| Mobile < 768 px | Bottom navigation: Home, Assistant, Knowledge, Approvals, More. Matrix becomes a list grouped by method ("Hybrid — tested on: NQ, TriviaQA, BEIR · Gaps: HotpotQA"). Claims as cards. Map shows list view. Decision Impact review stacks sections vertically. |

---

## 8. Accessibility

- WCAG 2.2 AA target.
- Keyboard-operable everything, including Matrix (arrow-key navigation between cells) and Map alternatives.
- Visible focus; text ≥ 4.5:1; controls ≥ 3:1.
- Screen-reader labels for icons, badges, and cells.
- Supports/Contradicts/Candidate/Needs review always have text or icon cues.
- Live regions for streaming status and new alerts (polite).
- Respect reduced motion.

---

## 9. Design workflow and status

### 9.1 Workflow

1. Mockups in Claude Design (canvas "ORIVANA — MVP UI").
2. Export screens as PNG to `docs/design/screens/` for Claude Code.
3. Build in Claude Code with mock JSON contracts (`packages/contracts`).
4. Backend in Go implements `docs/API-CONTRACT.md` exactly.

### 9.2 Artboards

Existing (done, 35): design system, shell, states, search results, sign in (+ errors), sign up, check email, reset password, onboarding 1–3, home (+ empty), assistant (+ retrieving, no evidence, conflict), sources, source viewer, graph (+ list, mobile), memory, project, approvals (+ edit, executing, succeeded, rejected), integrations, activity, settings (+ delete).

New / updated for v2:

| Artboard | Type |
|---|---|
| `knowledge-matrix` | New |
| `knowledge-matrix-mobile` | New |
| `knowledge-claims` | New |
| `decision-impact-review` | New |
| `save-as-decision-sheet` | New |
| `zotero-import-dialog` | New |
| `settings-model-preferences` | New |
| `home` | Update: decisions needing review card |
| `onboarding-2` | Update: Zotero first |
| `sources` | Update: Zotero badge + import button |
| `memory` | Update: review state, decisions first |
| `project` | Update: alerts on timeline, new tabs |
| `approvals` | Update: origin from alert |
| `integrations` | Update: Zotero card, MCP "coming later" card |
| `graph` → `map` | Rename + legend |

---

## 10. Prompt for Claude Design (v2 additions)

Use in the existing canvas so styles stay consistent. Attach the updated `PRD.md` and `UI.md`.

```text
I attached the updated PRD.md (v2.0) and UI.md (v2.0) for ORIVANA. Read both fully.

Use the existing design system, TopBar, and Sidebar in this canvas. Use skills ui-ux-pro-max and frontend-ui-engineering while designing, and web-design-guidelines to audit at the end.

Positioning has changed: ORIVANA leads with decisions and evidence, not chat. Follow UI.md §2.3 for Supports / Contradicts / Candidate / Needs review — always with text or icon, never color alone.

Create these NEW artboards (1440px unless stated):
1. Knowledge → Matrix (UI.md §4.7): Methods × Datasets table with filled cells (count + citation chips), candidate cells (dashed), and visible gaps ("—", "No evidence"). Right inspector for the selected cell "Dense retrieval × HotpotQA" with passages.
2. Knowledge → Matrix, mobile 390px: list grouped by method with gaps.
3. Knowledge → Claims (§4.8): claim cards with Supports/Contradicts/Mentions counts and "Used by 1 decision"; inspector with two-column evidence comparison for "Hybrid retrieval outperforms dense-only retrieval on open-domain QA".
4. Decision Impact review (§4.11): decision "Use hybrid retrieval for thesis experiments", claim affected, old supporting evidence vs new contradicting evidence (Varga & Chen 2024, p. 9, §5), system assessment, and actions Keep decision / Revise decision / Propose action.
5. Save as decision side sheet over the Assistant (§4.5).
6. Zotero import dialog (§4.6): connect → choose collections → target project → summary → progress.
7. Settings → Model preferences (§4.16).

UPDATE these artboards:
- Home: add "Decisions needing review" card at the top (§4.4).
- Onboarding 2: "Connect Zotero (recommended)" as the primary option.
- Sources: Zotero type badge, "Import from Zotero" button, one "Removed in Zotero" row.
- Memory: decisions first, Needs review badge, default filter Needs review.
- Project: alerts on the decision timeline; tabs per §4.12.
- Approvals: origin "From Decision Impact alert".
- Integrations: Zotero card (read-only), GitHub card, "Use ORIVANA in Claude / ChatGPT" card marked Coming later.
- Rename Graph to Map and add an edge legend.
- Sidebar: Home badge "1" (decision needs review), Knowledge tabs Sources · Matrix · Claims · Map · Memory.

Link everything for Play mode, following the demo script in UI.md §13.
Finish with web-design-guidelines and the checklist in UI.md §12; list pass/fail and fix failures.
```

---

## 11. Prompt for Claude Code — Phase 8 (v2 features)

Run after Phase 7 is committed. Replace `docs/PRD.md`, `docs/UI.md`, `docs/README.md` with v2.0, and add new PNGs to `docs/design/screens/` if available.

```text
The docs were updated to v2.0. Read docs/PRD.md, docs/UI.md, and docs/README.md fully, and look at any new images in docs/design/screens/. Compare with the current code and docs/API-CONTRACT.md.

Use skills: frontend-design, frontend-ui-engineering, ui-ux-pro-max, vercel-react-best-practices while building; web-design-guidelines for audits.

GOAL (Phase 8): add the v2.0 features to the existing prototype WITHOUT breaking existing screens. Everything stays mock-JSON driven through services; no hardcoded data in components.

Work in sub-phases. At the end of each: run dev server and build, no TypeScript/console errors, commit, summarize (including skills used), and WAIT for my approval.

8.0 Plan
- List the differences between v1.1 and v2.0 that affect code (UI.md §0 and §9.2).
- List new/changed types, fixtures, services, routes, and components. No code yet.

8.1 Contracts (additive only)
- Types/fixtures for: matrix (GET /knowledge/matrix, /knowledge/matrix/cell), claims (GET /claims, GET/PATCH /claims/{id}), decision alerts (GET /decision-alerts, PATCH /decision-alerts/{id}, POST /decision-alerts/{id}/propose-action), memory fields (kind, rationale, review_state, dependencies), source type "zotero" + zotero fields, Zotero endpoints (/connections/zotero/collections, /connections/zotero/sync), models (GET /models, GET/PATCH /me/preferences), message.model.
- Fixture data must tell the flagship story: decision "Use hybrid retrieval for thesis experiments" depends on claim "Hybrid retrieval outperforms dense-only retrieval on open-domain QA", supported by Santos & Lee 2025 (p. 4) and Okafor et al. 2025 (p. 6), newly contradicted by Varga & Chen 2024 (p. 9, §5) imported from Zotero.
- Update docs/API-CONTRACT.md. Do not change existing endpoint shapes.

8.2 Knowledge restructure
- Knowledge tabs: Sources · Matrix · Claims · Map · Memory. Rename Graph to Map (keep its behavior) and add the legend.
- Matrix (UI.md §4.7): accessible table, filled/candidate/gap/selected cells, inspector, filters, CSV export, arrow-key navigation, mobile list.
- Claims (§4.8): cards, sorting/filters, EvidenceCompare inspector, confirm/merge/reject.

8.3 Decisions and Decision Impact
- Memory (§4.10): decisions first, review state, detail sheet with dependencies and history.
- Decision Impact review page (§4.11) with Keep / Revise / Propose action working against mock services.
- Home card "Decisions needing review"; sidebar Home badge; Project timeline alerts.
- Assistant: "Answered with <model>" label and Save as decision sheet.
- Approvals: origin "From Decision Impact alert"; after success, "Linked to decision".

8.4 Zotero, models, integrations
- Sources: Zotero badge, Import from Zotero dialog (§4.6), "Removed in Zotero" state.
- Onboarding 2: Zotero first.
- Integrations: Zotero card, GitHub card, MCP "Coming later" card.
- Settings → Model preferences (§4.16).
- Activity: new event types (zotero_sync, extraction, decision_alert).

8.5 Audit and demo
- web-design-guidelines on changed files; UI.md §12 checklist (pass/fail table); fix failures.
- Update README demo script to UI.md §13 and make the flagship flow fully clickable.

RULES: UI text in English; tokens only (no raw hex in components); status never color-only (UI.md §2.3); actions use <button>, navigation uses <a>/Link; components ~200 lines max; never show success before the mock service confirms.

Start with 8.0.
```

---

## 12. UI acceptance checklist

- [ ] Navigation matches §3.2; Knowledge tabs are Sources · Matrix · Claims · Map · Memory.
- [ ] Tagline and category match PRD exactly.
- [ ] Current workspace and project are always identifiable.
- [ ] Search results show type and source.
- [ ] Every citation opens the right page and passage.
- [ ] Matrix shows filled, candidate, and gap cells distinguishably without color alone.
- [ ] Every Matrix cell and Claim opens its evidence.
- [ ] Supports / Contradicts / Candidate / Needs review follow §2.3.
- [ ] Decisions show status, review state, rationale, dependencies, history.
- [ ] Decision Impact review shows old vs new evidence and the three actions.
- [ ] A decision alert can produce a proposal that appears in Approvals with its origin.
- [ ] Action preview shows exact target and side effects; no success before confirmation.
- [ ] Zotero is clearly read-only.
- [ ] Model used is visible on answers; model preference is changeable.
- [ ] Integration scopes are understandable.
- [ ] Empty, loading, and error states exist for every new screen.
- [ ] Keyboard navigation works, including Matrix cells.
- [ ] Contrast: text ≥ 4.5:1, controls ≥ 3:1.
- [ ] Assistant never shows four full columns with the expanded sidebar.
- [ ] Mobile never forces a dense graph or a wide table without an alternative.

---

## 13. Demo script (for supervisor presentations)

Three minutes, in Play mode or the running prototype:

1. **Sign in** → Home shows "1 decision needs review".
2. Open **Knowledge → Matrix**: point out the gap "Hybrid × HotpotQA".
3. Open **Claims**: "Hybrid outperforms dense-only" — 2 supports, 1 new contradiction.
4. Open the **Decision Impact review**: old vs new evidence; click a citation → page 9 of Varga & Chen.
5. **Propose action** → GitHub issue "Re-evaluate retrieval choice for multi-hop questions".
6. **Approvals** → review preview with evidence links → Approve → Executing → Succeeded + Verified.
7. **Activity**: Zotero sync → extraction → alert → proposal → approval → issue created.
8. (Optional) **Assistant**: ask a question, show page-level citations and "Save as decision".

Key sentence: "NotebookLM helps me read my papers. ORIVANA keeps my research decisions honest as evidence changes — and helps me act on it."

---

## 14. Final design principle

ORIVANA should feel like a **research decision workspace with an intelligent action layer**, not a chatbot with a graph attached.

The Matrix shows what has and has not been tested. Claims show where evidence agrees and disagrees. Decisions record what the user chose and why. Decision Impact shows when that choice is at risk. Approvals show exactly what will happen next. The user remains in control.
