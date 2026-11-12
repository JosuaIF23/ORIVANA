# ORIVANA — frontend prototype

**Personal Intelligence & Action Platform** — *Your Knowledge, Connected. Your Intent, in Motion.*

A clickable React prototype of every MVP screen: the artboards in `docs/design/screens/` plus the v2.0 screens from `docs/UI.md` (Matrix, Claims, Decision Impact, Zotero, Model preferences). ORIVANA keeps a researcher's decisions aligned with the evidence in their own papers. There is no backend yet: a typed mock layer behaves like the Go REST + SSE API described in [`docs/API-CONTRACT.md`](docs/API-CONTRACT.md), with simulated latency, errors, and streaming.

## Run it

Requirements: Node.js 20 or newer and npm.

```bash
npm install
```

```bash
npm run dev
```

Open http://localhost:5173.

| Command | What it does |
|---|---|
| `npm run dev` | Vite dev server on port 5173 |
| `npm run build` | Type-check (`tsc --noEmit`) and production build to `apps/web/dist` |
| `npm test` | Vitest: lifecycle tests for the mock services (auth, approvals, memory, graph, sources, SSE, and v2: matrix, claims, Decision Impact, Zotero, models) |
| `npm run typecheck` | Type-check `packages/contracts` and `apps/web` |
| `node packages/contracts/scripts/generate-fixtures.mjs` | Regenerate every fixture JSON. **Restart `npm run dev` afterwards** (Vite doesn't watch files outside `apps/web`). |

The mock database lives in memory. Reloading the page resets all data to the fixtures and keeps you signed in. Signing out ends the mock session.

### Demo accounts (prototype only)

Stored in `packages/contracts/fixtures/auth/_test-accounts.json`. The sign-in page has a **"Prototype: fill the demo account"** link that fills the returning user for you.

| Email | Scenario |
|---|---|
| `josua@example.edu` | Returning researcher with the full RAG Comparison workspace (goes straight to Home) |
| `new@example.edu` | New user with an empty workspace (goes to Onboarding, then the empty Home) |
| `unverified@example.edu` | Shows the "Verify your email to continue" state |

Any other email or password shows "Email or password is incorrect" with the attempts left, and after four tries the rate-limit message.

## Demo flow (UI.md §13, about three minutes)

Sign in → Home "1 decision needs review" → Matrix (gap) → Claims → Decision Impact review → Propose action → Approvals → Approve → Succeeded + Verified → Activity.

1. **Sign in.** Open http://localhost:5173, select *Prototype: fill the demo account*, then **Sign in**. **Home** shows *Decisions needing review · 1 decision needs review*, and the sidebar Home item shows a **1** badge.
2. **Matrix.** Open *Knowledge → Matrix*. Methods (BM25, Dense retrieval, Hybrid retrieval, GraphRAG) × datasets (Natural Questions, TriviaQA, HotpotQA, BEIR), with papers [1] Santos & Lee, [2] Okafor et al., [3] Varga & Chen, [4] Ito. Point out the gap **Hybrid retrieval × HotpotQA** (dashed "—"). Select it: *No evidence in your collection*, plus one candidate paper that isn't counted yet. Arrow keys move between cells. *Include candidates* shows candidate cells with a dashed border.
3. **Claims.** Open *Claims*. The first card is *Hybrid retrieval outperforms dense-only retrieval on open-domain QA*: ✓ 2 Supports · ✕ 1 Contradicts · 3 Mentions · *New contradiction* · *Used by 1 decision*. Select it: Supports (Santos & Lee p. 4, Okafor et al. p. 6) next to Contradicts (Varga & Chen p. 9, imported from Zotero).
4. **Decision Impact review.** Back on Home, select **Review** (or follow *Used by 1 decision*). You see the decision, the claim affected, and old vs new evidence side by side, with the model's labelled *System assessment*. Select **Open in document · p. 9**: the viewer opens Varga & Chen at page 9 with the passage highlighted and a *Back* link.
5. **Propose action.** Select **Propose action**. ORIVANA creates the GitHub issue proposal *Re-evaluate retrieval choice for multi-hop questions* and opens it in **Approvals** (3 pending). *Origin: From Decision Impact alert: Use hybrid retrieval for thesis experiments*. The issue body cites the evidence and the decision.
6. **Approve.** Select **Approve & create issue** → **Executing** → **Succeeded + Verified** (*Issue #42 created*), the verification checks, and **Linked to decision D-04**. Approve, Edit, and Reject stay locked until GitHub confirms.
7. **Activity.** Open **Activity** and use the chips *Zotero sync → Extraction → Decision alerts → Proposals → Approvals → External actions*: Varga & Chen synced from Zotero (10 Nov 16:40), extraction, the alert (16:45), the proposal, your approval, and the verified issue.
8. *(Optional)* **Assistant.** Open *Hybrid vs dense-only results*: every answer shows *Answered with Claude Sonnet 5.5* and a notice that it relates to a decision that needs review. **Save as decision** opens a side sheet prefilled with the answer, its citations as evidence, and suggested claims. Change the answer model in *Settings → Model preferences*; new answers then show the new model.

Back on the review page, **Keep decision** (needs a short note) or **Revise decision** (saves D-06, which supersedes D-04) closes the alert. Home then shows no decisions to review.

### Assistant flow (v1, still available)

1. **Home.** In *Ask your knowledge*, type `Which papers report that hybrid retrieval beats dense-only?` and select **Ask**.
2. **Assistant.** Watch the answer stream: *Retrieving sources…*, then tokens and numbered citations. Select chip **[2]**: the evidence panel switches to Okafor et al. 2025, p. 6. **Open in document · p. 6** opens the page with the passage highlighted.
3. **Ask for an issue.** Type `Create a GitHub issue in lab/rag-experiments to re-run our eval with hybrid retrieval, based on this finding.` The answer includes the proposed action (Approve / Edit / Reject). Nothing is sent until you approve it in **Approvals**.

### Other states to try

| State | How |
|---|---|
| No evidence | Ask `What learning rate did the GraphRAG paper use for fine-tuning?` |
| Conflicting sources | Ask `Does a chunk size above 512 tokens hurt retrieval quality?` |
| Model error + Retry | Ask anything containing `simulate error` |
| Cancelled partial answer | Select **Stop** while an answer streams |
| Failed ingestion + Retry | *Knowledge → Sources* → `survey-scan-2019.pdf` → **Retry** (it fails again: password-protected) |
| Zotero import | *Knowledge → Sources* → **Import from Zotero** → tick *Thesis — graph retrieval* → **Import** → progress → **View in Sources** |
| Removed in Zotero | *Sources*, type *Zotero*: *Sparse–Dense Hybrids in Low-Resource Domains* → **Keep** or **Delete from ORIVANA** |
| Zotero sync | *Integrations → Zotero → Sync now* (read only; nothing is written to Zotero) |
| Map with legend | *Knowledge → Map* (the old `/knowledge/graph` links redirect here): Supports ✓ / Contradicts ✕ / Mentions edges |
| Claim review | *Claims* → *The hybrid advantage disappears on multi-hop questions* → **Confirm claim**, or **Merge with…** |
| Decisions | *Knowledge → Memory*: Decisions (Needs review → Proposed → Confirmed); select a title for the sheet with dependencies and history; *Other memories* for the v1 view |
| Project | *Projects → RAG Comparison*: alert on the overview and timeline; tabs Matrix, Claims, Decisions, Activity (old `graph`, `memories`, `timeline` tabs redirect) |
| Model preferences | *Settings → Model preferences*: pick *GPT-5 mini*, then ask a question |
| Workspace deletion dialog | *Settings → Data deletion → Delete workspace data…* |
| Search | Press `Ctrl+K` (`⌘K` on macOS) and type `hybrid` (includes a Claims group) |
| Onboarding | Sign in as `new@example.edu`: step 2 leads with **Connect Zotero (recommended)**, or use *Prototype: use the sample paper* |
| Phone layout | Narrow the window below 768 px: bottom navigation Home · Assistant · Knowledge · Approvals · More; Matrix becomes a list grouped by method; Claims are cards; Map is a list |

## Project layout

```
apps/web/                 React 19 + TypeScript + Vite + Tailwind CSS v4 + Radix (shadcn-style) + React Router 7 + TanStack Query + React Flow
  src/app/                router (one lazy chunk per screen), error route
  src/components/ui/      primitives: button, field, dialog, menu, switch/checkbox
  src/components/common/  StatusBadge, OriginBadge, ReviewStateBadge, SourceTypeBadge, ModelLabel, EvidenceCompare, CitationChip, states, toast
  src/components/shell/   AppShell, TopBar, Sidebar (240 px ↔ 64 px rail), mobile nav, help
  src/features/<screen>/  pages, components, hooks per feature
  src/services/           mock REST + SSE over an in-memory store seeded from fixtures
packages/contracts/
  types/                  one file per entity (PRD §12) + SSE events; v2: matrix, claim, decision-alert, model, zotero
  fixtures/               JSON per endpoint (PRD §17) — generated by scripts/generate-fixtures.mjs
docs/
  PRD.md, UI.md           product and UI specifications
  API-CONTRACT.md         the contract the Go backend implements
  design/SCREENS.md       image → screen → route → components → data, plus design/doc differences
  AUDIT.md                web interface audit and UI.md §12 checklist
CLAUDE.md                 working rules for this repository
```

Rules that hold everywhere: components never import JSON (only `services/core/fixtures.ts` does); no raw hex in components (tokens from UI.md §2); statuses always have text or an icon (UI.md §2.3); nothing shows success before the service confirms it; Zotero is read only; every write to an external app waits for approval; the API contract is additive only.
