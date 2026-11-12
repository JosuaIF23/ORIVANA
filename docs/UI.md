# ORIVANA — UI/UX Design Specification

> Companion document to `PRD.md`\
> **Product:** ORIVANA\
> **Version:** 1.1 (11 November 2026)\
> **Design direction:** Professional personal intelligence workspace\
> **Initial theme:** Dark-first, with accessible light-theme support later\
> **Primary platform:** Desktop web application, responsive tablet/mobile views\
> **Initial persona:** Researchers and postgraduate students (see PRD §4)

---

## 1. Design objective

Design ORIVANA as a serious, calm, trustworthy workspace for people who manage complex information and want AI to help them act on it.

The interface must communicate three things immediately:

1. The system understands the user's knowledge and projects.
2. AI answers can be inspected against original sources.
3. External actions are visible and controlled by the user.

Do not make the product look like a generic chatbot, crypto dashboard, sci-fi control room, or crowded analytics product.

### Experience principles

- Evidence is visible, not hidden behind a "trust me" answer.
- Graphs are useful exploration tools, not decorative backgrounds.
- Actions have previews, permissions, and clear outcomes.
- The user can always inspect, edit, correct, or delete memory.
- Complex capabilities are progressively disclosed.
- Empty, loading, error, and permission states are designed as carefully as success states.

### Brand identity

**ORIVANA** is a coined working name. Its identity should feel like a capable personal intelligence environment rather than a generic AI chatbot.

| Attribute | Value |
|---|---|
| Name | ORIVANA |
| Tagline | Your Knowledge, Connected. Your Intent, in Motion. |
| Product category | Personal Intelligence & Action Platform |
| Visual metaphor | Connected knowledge paths converging into purposeful action |
| Logo direction | A simple custom symbol built from connected paths or layered nodes; avoid literal brain, robot, or generic neural-network imagery |
| Wordmark | Uppercase ORIVANA with restrained geometric typography |
| Brand voice | Clear, grounded, thoughtful, and transparent about uncertainty |

Use the tagline and category exactly as written. Never describe the product as "autonomous".

The name is a working brand candidate. Do not publish it as legally cleared until trademark, domain, company-name, and social-handle checks are completed.

---

## 2. Visual direction

### Brand personality

- Intelligent
- Calm
- Precise
- Trustworthy
- Technical but approachable
- Quietly futuristic

### Design tokens (dark theme)

Contrast ratios below were calculated against the WCAG 2.x formula.

| Token | Value | Usage | Contrast notes |
|---|---|---|---|
| `bg-app` | `#0B0D12` | Main canvas | — |
| `bg-sidebar` | `#10141C` | Primary navigation | — |
| `bg-surface` | `#151B26` | Cards and panels | — |
| `bg-elevated` | `#1B2432` | Dialogs, popovers, hovered rows | — |
| `text-primary` | `#F3F6FA` | Main text | 14.4:1 on elevated |
| `text-secondary` | `#A5B0C0` | Supporting text | 7.1:1 on elevated |
| `text-muted` | `#8390A3` | Metadata, timestamps | 4.8:1 on elevated (was `#748094`, which failed at 3.9:1) |
| `accent-primary` | `#8B9CFF` | Primary actions, selected states, focus ring | 6.2:1 as text on elevated |
| `on-accent` | `#0B0D12` | Text/icons on primary buttons | 7.7:1 on accent (white text fails at 2.3:1) |
| `accent-knowledge` | `#63D6C3` | Knowledge/graph signals | 8.9:1 on elevated |
| `status-warning` | `#F2B96B` | Needs review, candidate | 8.9:1 on elevated |
| `status-danger` | `#F07878` | Destructive, error | 5.7:1 on elevated |
| `border-subtle` | `#273142` | Dividers and card outlines (decorative only) | 1.3:1 — not for controls |
| `border-control` | `#64728A` | Input, checkbox, and select borders | 3.2:1 on elevated (meets 3:1 non-text contrast) |

Rules:

- Primary buttons: `accent-primary` background with `on-accent` text. Never white text on the accent.
- Warning and danger badges with filled backgrounds use `#0B0D12` text.
- Focus ring: 2 px `accent-primary` with 2 px offset.
- Validate again in the design tool after any token change.

### Typography

- Use Inter, Geist, or a similar modern sans-serif.
- Type scale: 12, 14, 16, 20, 24, 32 px. Body text in workspaces: 14 px; reading surfaces (document viewer, answers): 16 px.
- Avoid oversized headings inside dense workspaces.
- Use monospace only for IDs, code, technical metadata, and logs.

### Layout

- Desktop baseline: 1440 × 900.
- Sidebar: 240 px, collapsible to a 64 px icon rail.
- Main content: flexible width with a max width of about 760 px for reading surfaces.
- Right context panel: 320–380 px when needed.
- Use 8 px spacing increments.
- Keep the graph canvas and document viewer spacious.
- **Column budget rule:** at 1440 px, never show more than three full-width columns at once. Screens that need a fourth column (e.g., Assistant) collapse the app sidebar to the icon rail.

---

## 3. Global application shell

### Desktop structure

```text
┌──────────────────────────────────────────────────────────────────────────────┐
│ ORIVANA     Search anything...                 Help   Notifications Avatar │
├───────────────┬──────────────────────────────────────┬───────────────────────┤
│ Workspace ▾   │ Main content                         │ Context / Inspector   │
│               │                                      │                       │
│ Home          │                                      │ Evidence              │
│ Assistant     │                                      │ Source details        │
│ Knowledge     │                                      │ Entity details        │
│ Projects      │                                      │ Action preview        │
│ Approvals (2) │                                      │                       │
│ Activity      │                                      │                       │
│ Integrations  │                                      │                       │
│               │                                      │                       │
│ Settings      │                                      │                       │
└───────────────┴──────────────────────────────────────┴───────────────────────┘
```

### Navigation (MVP)

| Item | Contains |
|---|---|
| Home | Command center |
| Assistant | Conversations with evidence |
| Knowledge | Tabs: **Sources**, **Graph**, **Memory** |
| Projects | Project list and project workspace |
| Approvals | Pending action proposals (badge with count) and decision history |
| Activity | Audit timeline |
| Integrations | Connected apps and scopes |
| Settings | Account, privacy, memory controls, export/delete |

**Automations** is post-MVP. Do not show it in MVP navigation; when it ships it goes between Approvals and Activity.

Use a workspace switcher at the top of the sidebar. Show the pending approval count as a subtle numeric badge, not an alarm-like notification.

### Global search

Search supports:

- Sources and files.
- Projects.
- Entities and concepts.
- Memories and decisions.
- Conversations.
- Actions and integrations.

Group results by type. Each row shows a type icon and label, source, project, and modified date. Do not present all result types as indistinguishable text rows. Keyboard: `⌘K` / `Ctrl+K` opens search; arrow keys move; Enter opens.

---

## 4. Required screens

### 4.1 Landing page (post-MVP polish; minimal version for MVP)

**Goal:** explain the value proposition before asking users to sign up.

Sections:

1. Hero: "Your Knowledge, Connected. Your Intent, in Motion."
2. Short explanation of Knowledge-to-Action Intelligence.
3. Three-step visual: Connect → Understand → Act.
4. Product screenshots: cited assistant, graph, action approval.
5. Trust section: source provenance, permissions, user control.
6. Use cases: research first; development and knowledge work as "coming later".
7. CTA: Get started / Sign in.

Avoid claiming that the system "remembers everything" or "works autonomously without limits."

For the MVP, a minimal page with the hero, three-step visual, and sign-in/sign-up buttons is enough.

### 4.2 Sign up / Sign in / Verify / Reset

**Goal:** secure and low-friction access.

Sign up fields:

- Name (optional).
- Email.
- Password (with strength hint).
- Terms/privacy acknowledgment.

Sign in:

- Email.
- Password.
- Forgot password link.
- Post-MVP: Google sign-in.

Additional screens:

- "Check your email" after sign up (with resend).
- Email verified confirmation.
- Forgot password (email input) and "reset link sent".
- Set new password.

Required states:

- Invalid credentials.
- Email not verified (with resend action).
- Password reset sent.
- Expired or already-used link.
- Rate limit.
- Session expired.
- Loading and disabled submit.
- MFA challenge (post-MVP).

Do not imply that external app connections are part of login. Account authentication and connector authorization are separate flows.

### 4.3 Onboarding

A short guided sequence:

1. Welcome and explain the product in one sentence.
2. Confirm use case (Research is preselected; others shown as "coming later").
3. Create first project (optional).
4. Upload a PDF or Markdown file (GitHub connection offered but skippable).
5. Explain what will be extracted and indexed while ingestion runs.
6. Show privacy and memory controls.
7. Ask the user to try a cited question (suggested prompts based on the uploaded file).

Allow "Skip for now" on every step except account creation. Never force users to connect applications during onboarding.

### 4.4 Home / Command Center

**Goal:** give users an overview and a direct way to start work.

Layout:

- Greeting and "Ask your knowledge" input (primary).
- Recent projects.
- Recently added sources with ingestion status.
- Pending approvals (count and top items).
- Recent activity.
- Connector health.
- Suggested next steps based on explicit user activity, not opaque profiling.

Primary actions: Ask a question · Add a source.

Empty state (new user): a single card with "Upload your first paper" and a short explanation of what happens next.

### 4.5 Assistant workspace

**Goal:** make evidence-grounded conversation the central interaction.

Layout at 1440 px (app sidebar collapsed to the 64 px icon rail on this screen):

```text
┌────┬──────────────┬──────────────────────────────┬──────────────────┐
│Rail│Conversations │ Chat timeline                │ Evidence panel   │
│64px│  280px       │  ~700px                      │  360px           │
│    │ (collapsible)│                              │                  │
│    │              │ [Composer]                   │                  │
└────┴──────────────┴──────────────────────────────┴──────────────────┘
```

- The conversation list can be collapsed to give the chat ~980 px.
- On widths below 1280 px, the conversation list becomes a dropdown in the chat header.

Assistant message anatomy:

- Answer text with numbered inline citation chips `[1]`, `[2]`.
- Citation list: source title, page, section.
- Confidence/limitations in plain language where appropriate.
- Related entities and project context.
- Actions: Copy · Open source · Explore relationship · Flag incorrect.
- "Create action" only when relevant (e.g., the user asked for a GitHub issue).

Evidence panel:

- Selected citation's passage with the quoted span highlighted.
- Source title, page, section, added date.
- "Open in document viewer" (jumps to the page and highlights the span).
- List of other passages used in the answer.

Composer:

- Text input (multi-line, `Enter` sends, `Shift+Enter` new line).
- Attach source.
- Project/scope selector.
- Scope indicator ("Searching: Project RAG Comparison · 14 sources").
- Send / Stop button.
- Voice input: post-MVP.

States:

- Retrieving sources (shows count of passages found).
- Generating answer (streaming).
- No evidence found (answer abstains and suggests adding a source).
- Conflicting sources (both sides shown with citations).
- Source inaccessible (deleted or still processing).
- Model error (retry).
- User cancelled generation (partial answer marked as cancelled).

### 4.6 Knowledge → Graph

**Goal:** explore relationships and inspect the evidence behind them.

Layout:

- Main canvas with graph.
- Left filter panel: entity type, project, source, date, status (confirmed / candidate).
- Right inspector: selected node or edge details.
- Search and "Focus on" control.
- Graph depth control (1 or 2 hops).
- "List view" toggle (textual alternative).

MVP node types: **Paper, Method, Dataset, Claim, Concept, Project, Decision.** Each type has an icon and a shape or label — not color alone.

MVP edge types: **Uses method, Evaluates on, Supports, Contradicts, Supersedes, Derived from, Contains.** Edge type is shown as a label on hover/selection and in the inspector.

Interaction:

- Click node to inspect.
- Click edge to inspect relationship and evidence passages.
- Double-click or "Expand" to add one hop.
- Filter by project/date/type/status.
- Open source passage from evidence.
- Confirm or reject a candidate relationship from the inspector.
- Candidate edges are dashed with a "Candidate" label; hidden by default with a toggle "Show candidates".

Do not render thousands of nodes at once. Start with a focused subgraph (max ~150 nodes) and provide progressive expansion.

Empty state: "Your graph builds as you add papers" with a link to Sources.

### 4.7 Knowledge → Sources (library and document viewer)

**Goal:** manage imported information.

Library features:

- Table/list toggle.
- File type icon.
- Title, type, project, status, pages, added date.
- Search and filters.
- Upload button (drag-and-drop zone).
- Processing status badge with text (Queued, Parsing, Indexing, Ready, Failed).
- Retry/reprocess for failed items.
- Delete with a clear description of derived data that will be removed (chunks, citations in past answers, graph evidence).

Source detail / document viewer:

- Original metadata.
- Page-based viewer with section navigation.
- Highlighted passage when opened from a citation.
- Entities extracted (chips).
- Relationships created.
- Ingestion history (job attempts and errors).
- Reprocess action.

### 4.8 Knowledge → Memory

This is a core trust screen.

List columns:

- Memory type (episodic, semantic, procedural, project).
- Content.
- Project.
- Origin (user-created, imported, model-proposed).
- Source/evidence.
- Created/updated dates.
- Status (candidate, confirmed, superseded, rejected) as a text badge.
- Confidence.

Actions:

- Confirm.
- Edit.
- Mark superseded (choose the replacing memory).
- Reject.
- Delete.
- View related memories.

Default filter: "Needs review" (candidates) at the top, then confirmed.

Users must be able to inspect and correct what the system remembers. Do not silently turn speculative inferences into permanent user facts.

### 4.9 Project workspace

**Goal:** keep a durable context for a specific outcome.

Tabs:

- Overview
- Sources
- Graph
- Memories & decisions
- Conversations
- Actions
- Timeline

Overview cards:

- Project description.
- Current status.
- Recent changes.
- Key decisions (confirmed, latest first).
- Related sources.
- Pending actions.

Decision record:

- Decision title.
- Decision statement.
- Status: proposed / confirmed / superseded.
- Date.
- Rationale.
- Evidence sources.
- Supersedes / superseded by links.

Decision timeline shows superseded decisions struck through with a link to the replacement.

### 4.10 Approvals (inbox and action review)

**Goal:** make AI actions inspectable before execution.

Inbox:

- List of pending proposals: action, target app/account, project, risk tier, created time.
- Tabs: Pending · Decided.
- Click opens the review view.

Review view displays:

- User's original request.
- Proposed action in plain language ("Create issue in `lab/rag-experiments`").
- Target application and account.
- Required permission scope.
- Exact content to be sent (rendered preview + raw fields).
- Evidence/context used (citations).
- Risk tier.
- Expected side effects.
- Buttons: **Approve**, **Edit**, **Reject**.

Editing returns the proposal to Draft and re-validates before it can be approved.

In the MVP every write requires explicit approval. Do not use a single generic "Allow AI" permission for every capability.

After execution:

- Executing state (no success message until the backend confirms).
- Success with external link or ID (e.g., the GitHub issue URL).
- Failure with reason.
- Verification result.
- Audit event link.
- Retry only when idempotency and duplicate checks are handled.

Proposals also appear inline in the Assistant conversation with the same Approve/Edit/Reject controls.

### 4.11 Integrations

Directory cards:

- Provider name and logo.
- Capabilities: read, create (MVP: GitHub read + create issue).
- Connection status.
- Last sync.
- Granted scopes in plain language.
- Connect / reconnect / revoke.

Connection flow:

1. Explain what data will be accessed and which repositories.
2. Request minimum required scopes.
3. Redirect to provider OAuth.
4. Tokens stored server-side (never shown).
5. Show connection success and granted permissions.

MVP shows **GitHub** as the only connectable integration. Others may appear as "Coming later" cards (Obsidian sync, Google Drive).

### 4.12 Activity and audit

Timeline filters:

- Ingestion.
- Search/retrieval.
- Memory updates.
- Tool calls.
- Approvals.
- External actions.
- Errors.

Each event shows:

- Actor (user, agent, system).
- Timestamp.
- Target.
- Result.
- Related task/source.
- Details and error message where appropriate.

### 4.13 Settings

Sections:

- Profile.
- Security and sessions (active sessions, sign out others).
- Connected applications (shortcut to Integrations).
- Model preferences.
- Memory controls.
- Data export.
- Data deletion (source, workspace, account).
- Notifications.
- Appearance.

### 4.14 Automations (post-MVP)

Automation list:

- Name and description.
- Trigger.
- Connected apps.
- Last run.
- Status: active / paused / needs attention.
- Run history.

Workflow steps: trigger → retrieval/context → AI processing → approval → action → verification.

Start with a simple guided form, not a visual node editor.

---

## 5. Reusable components

- AppShell
- SidebarNavigation (with icon-rail mode)
- WorkspaceSwitcher
- GlobalSearch
- CommandInput
- SourceCard
- SourceStatusBadge
- DocumentViewer
- CitationChip
- EvidencePanel
- GraphCanvas
- GraphListView
- EntityInspector
- RelationshipEvidence
- ProjectCard
- DecisionTimeline
- MemoryCard
- StatusBadge (candidate / confirmed / superseded / rejected)
- OriginBadge (user / imported / model-proposed)
- ActionProposalCard
- ApprovalDialog
- IntegrationCard
- PermissionScopeList
- AgentRunTimeline
- EmptyState
- ErrorState
- LoadingSkeleton
- Toast / InlineAlert

Components must have accessible labels, keyboard focus, and consistent loading/error states.

---

## 6. UI state and interaction requirements

Every asynchronous operation needs:

- Idle state.
- Loading state.
- Success state.
- Recoverable error state.
- Retry/cancel behavior where appropriate.

Every destructive action needs:

- Clear explanation.
- Confirmation.
- Consequence description (what derived data is removed).
- Recovery information if available.

Every AI-generated object needs:

- Origin indicator (user-created, imported, model-proposed).
- Source/evidence when derived from external content.
- Status (candidate, confirmed, superseded, rejected) where applicable.

Do not use color alone to communicate status: pair color with a text label, icon, or line style.

---

## 7. Responsive behavior

### Desktop (≥ 1280 px)

Primary experience. Full sidebar, central workspace, optional right inspector. Assistant uses the icon rail.

### Tablet (768–1279 px)

Icon-rail sidebar and overlay inspector. Graph interactions remain available with reduced controls.

### Mobile (< 768 px)

Bottom navigation prioritizing:

- Search.
- Assistant.
- Source upload.
- Approvals review.
- Activity.
- Project summaries.

Do not show a dense full graph canvas as the default mobile screen. Provide the list/relationship view.

---

## 8. Accessibility

- WCAG 2.2 AA target.
- Keyboard-operable navigation and graph alternatives.
- Visible focus indicators (see tokens).
- Text contrast ≥ 4.5:1; control borders and focus indicators ≥ 3:1.
- Screen-reader labels for icons and graph controls.
- Do not rely only on color for graph edge meaning.
- Respect reduced-motion preferences.
- Provide a textual list alternative for graph visualization.

---

## 9. Design workflow and handoff

### Tool workflow

1. **Explore** directions in Google Stitch using the staged prompts in §10 (or an alternative such as UX Pilot or Banani).
2. **Refine** the chosen direction in Figma: build tokens as variables, components with states, and responsive frames. Figma Make can be used for quick clickable prototypes from that library.
3. **Prototype in code** with v0 or a coding agent using §11. v0 outputs React + Tailwind + shadcn/ui, which matches the PRD stack.
4. **Reference** real products while designing (e.g., Mobbin, Refero) — look at how Linear, Notion, Perplexity, and GitHub handle dense dark UIs, citations, and approvals.

### Handoff deliverables

Before implementation, produce:

1. Design tokens (Figma variables matching §2).
2. Desktop app shell (expanded and icon-rail).
3. Core screen designs.
4. Component states.
5. Responsive behavior.
6. Clickable prototype for primary flows.
7. Empty/loading/error/permission states.
8. Developer handoff notes.

### Recommended design order

1. Sign in / onboarding.
2. Home.
3. Assistant with evidence panel.
4. Source library and document viewer.
5. Knowledge graph.
6. Memory.
7. Project workspace.
8. Approvals.
9. Integrations.
10. Activity and settings.

---

## 10. Prompts for Google Stitch (staged)

Do not ask for the whole product in one prompt. Send the **base prompt** first, then one screen prompt at a time in the same project so the style stays consistent.

### 10.1 Base prompt (design system and shell)

```text
Design a high-fidelity desktop web application called ORIVANA.

Product:
ORIVANA is a Personal Intelligence & Action Platform. It connects a researcher's uploaded papers and notes, builds a traceable knowledge graph, remembers project decisions over time, and prepares actions in GitHub that the user must approve before they run.

Tagline: "Your Knowledge, Connected. Your Intent, in Motion."

Visual direction:
Professional, calm, premium, dark-first SaaS workspace. Thin borders, generous spacing, highly readable data density. No gradients, glow effects, sci-fi decoration, or generic chatbot styling.

Exact colors:
- App background #0B0D12, sidebar #10141C, cards #151B26, dialogs #1B2432
- Text primary #F3F6FA, secondary #A5B0C0, muted #8390A3
- Primary accent #8B9CFF (buttons use dark text #0B0D12 on the accent, never white)
- Knowledge/graph accent #63D6C3
- Warning #F2B96B, danger #F07878
- Divider #273142, input border #64728A

Typography: Inter. Sizes 12, 14, 16, 20, 24, 32 px. Body 14 px.
Spacing: 8 px grid.

Frame: 1440x900. Left sidebar 240 px with workspace switcher at top and items: Home, Assistant, Knowledge, Projects, Approvals (badge "2"), Activity, Integrations, Settings at the bottom. Top bar with global search "Search anything... ⌘K", help, notifications, avatar.

Sample content: a research project named "RAG Comparison" comparing retrieval-augmented generation methods (papers on GraphRAG, dense retrieval, hybrid BM25 + vector).

First, design only the empty app shell with the Home screen for a returning user.
```

### 10.2 Home

```text
Using the same ORIVANA style, design the Home / Command Center:
- Greeting and a large "Ask your knowledge" input as the primary element.
- Row of recent projects (RAG Comparison, Thesis Proposal).
- Recently added sources with status badges as text + color (Ready, Indexing, Failed).
- Pending approvals card: "Create GitHub issue: Re-run eval with hybrid retrieval" with Review button.
- Recent activity list and a small connector health row (GitHub: Connected).
Keep it calm and uncluttered.
```

### 10.3 Assistant

```text
Using the same ORIVANA style, design the Assistant screen.
The left sidebar is collapsed to a 64 px icon rail. Then a 280 px conversation list, a central chat (~700 px), and a 360 px evidence panel on the right.
- Show a user question: "Which papers report that hybrid retrieval beats dense-only, and on which datasets?"
- Show an assistant answer with numbered citation chips [1] [2] [3], a short "Limitations" line, and related entity chips (Hybrid retrieval, BM25, Natural Questions).
- The evidence panel shows the selected citation: paper title, page 6, section "4.2 Results", with the quoted sentence highlighted, and an "Open in document" button.
- Composer at the bottom with attach, scope indicator "Project: RAG Comparison · 14 sources", and send.
```

### 10.4 Knowledge graph

```text
Using the same ORIVANA style, design Knowledge → Graph.
- Tabs at top: Sources, Graph, Memory (Graph selected).
- Left filter panel: entity type checkboxes (Paper, Method, Dataset, Claim, Concept), project, status (Confirmed / Candidate), date.
- Center: a focused graph of ~25 nodes. Node types differ by icon and shape, not only color. Confirmed edges solid, candidate edges dashed with a "Candidate" label.
- Right inspector: a selected edge "Paper A — USES_METHOD → Hybrid retrieval" with two evidence passages (page and section), confidence, and Confirm / Reject buttons.
- Toolbar: search, Focus on, depth 1/2, List view toggle.
```

### 10.5 Approvals review

```text
Using the same ORIVANA style, design the Approvals screen.
- Left: list of pending proposals with risk tier badges.
- Main: review of "Create issue in lab/rag-experiments":
  original user request, target app and account (GitHub · @user), required scope, rendered issue preview (title, body, labels), raw fields, evidence used (2 citations), risk tier "Low write", expected side effects ("Creates 1 public issue").
- Buttons: Approve (primary), Edit, Reject.
- Also show a small variant of the success state with the issue link and a "Verified" check.
```

### 10.6 Source library and document viewer

```text
Using the same ORIVANA style, design Knowledge → Sources.
- Table with file icon, title, project, status badge with text (Queued, Parsing, Indexing, Ready, Failed), pages, added date, actions menu.
- One failed row with "Retry" and an error hint.
- Upload drop zone at top.
Then design the document viewer: page navigation, section outline on the left, a highlighted passage opened from a citation, and a right panel with extracted entities and ingestion history.
```

### 10.7 Memory, Project, Integrations

Use the same pattern: one prompt per screen, referencing §4.8, §4.9, and §4.11. Always include the empty, loading, and error state as small variants on the same canvas.

---

## 11. Prompt for v0 or Figma Make (after the design direction is approved)

```text
Build the approved ORIVANA interface as a responsive React + TypeScript application using Tailwind CSS and shadcn/ui.

Use the supplied UI specification and design tokens (define them as CSS variables and Tailwind theme colors):
bg-app #0B0D12, bg-sidebar #10141C, bg-surface #151B26, bg-elevated #1B2432,
text-primary #F3F6FA, text-secondary #A5B0C0, text-muted #8390A3,
accent-primary #8B9CFF with on-accent #0B0D12, accent-knowledge #63D6C3,
warning #F2B96B, danger #F07878, border-subtle #273142, border-control #64728A.

Implement the app shell (expanded sidebar and 64 px icon rail), routing, reusable components, realistic typed mock data, and functional client-side interactions.

Navigation: Home, Assistant, Knowledge (tabs Sources, Graph, Memory), Projects, Approvals, Activity, Integrations, Settings. No Automations.

Prioritize these flows:
- Sign in, verify email, and onboarding mock flow.
- Home to Assistant.
- Assistant answer to citation to document viewer at the cited page.
- Knowledge graph node/edge selection to inspector, with candidate edges dashed.
- Memory list with confirm/edit/supersede.
- Project decision timeline.
- Approvals: review, edit, approve/reject, with an executing state before success.
- Integrations: GitHub permission view.

Do not invent a production backend. Put typed mock data in a separate mock service layer whose function signatures mirror the REST endpoints in PRD §14, so it can be replaced by the Go REST/SSE API later. Simulate SSE streaming for assistant answers.

Use accessible controls, keyboard focus, responsive layouts, and loading/empty/error states. Keep the code modular; do not put the application in one component.
```

---

## 12. UI acceptance checklist

- [ ] Navigation is consistent across screens and matches §3.
- [ ] Tagline and category match PRD exactly.
- [ ] User can identify the current workspace and project.
- [ ] Search results show type and source.
- [ ] Assistant citations open the relevant page and passage.
- [ ] Graph nodes and edges expose provenance.
- [ ] Candidate relationships are visually distinct without relying on color.
- [ ] Memory can be confirmed, edited, superseded, and deleted.
- [ ] Action preview shows exact target and side effects.
- [ ] Approval and rejection produce visible state changes.
- [ ] Integration scopes are understandable.
- [ ] Empty/loading/error states are designed.
- [ ] Keyboard navigation and focus states work.
- [ ] Text contrast ≥ 4.5:1; control borders ≥ 3:1.
- [ ] Assistant screen never shows four full columns with the expanded sidebar.
- [ ] Mobile layout does not force a dense graph canvas.
- [ ] No screen implies an action succeeded before the backend confirms it.

---

## 13. Final design principle

ORIVANA should feel like a **personal knowledge workspace with an intelligent action layer**, not a chatbot with a graph attached.

The graph explains relationships. The evidence panel explains why the system believes something. Memory preserves context. The action review explains what the agent intends to do. The user remains in control.
