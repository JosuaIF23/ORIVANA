# ORIVANA — frontend prototype

**Personal Intelligence & Action Platform** — *Your Knowledge, Connected. Your Intent, in Motion.*

A clickable React prototype of every MVP screen in `docs/design/screens/`. There is no backend yet: a typed mock layer behaves like the Go REST + SSE API described in [`docs/API-CONTRACT.md`](docs/API-CONTRACT.md), with simulated latency, errors, and streaming.

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
| `npm test` | Vitest: lifecycle tests for the mock services (auth, approvals, memory, graph, sources, SSE) |
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

## Demo flow

Sign in → Home → Assistant → click a citation → Graph → ask for an issue → Approvals → Approve → Succeeded → Activity.

1. **Sign in.** Open http://localhost:5173, select *Prototype: fill the demo account*, then **Sign in**. You land on **Home**.
2. **Home.** In *Ask your knowledge*, type `Which papers report that hybrid retrieval beats dense-only?` and select **Ask**.
3. **Assistant.** Watch the answer stream: *Retrieving sources…* with passage counts, then tokens and numbered citations. The answer is stored when it's done.
4. **Click a citation.** Select chip **[2]**. The evidence panel switches to Okafor et al. 2025, page 6, §4.2 Results, with the quoted sentence highlighted. Select **Open in document · p. 6**: the viewer opens page 6 with the same passage highlighted and a banner linking back to the answer.
5. **Graph.** Select **Graph** in the evidence panel note (or *Knowledge → Graph*, then tick *Show candidates*). Click the dashed edge *Varga & Chen 2024 → Hybrid retrieval*: the inspector shows two evidence passages. **Confirm** turns the edge solid and the status to *Confirmed*. *List view* shows the same relationships as a table.
6. **Ask for an issue.** Go back to **Assistant**, type `Create a GitHub issue in lab/rag-experiments to re-run our eval with hybrid retrieval, based on this finding.` and press **Enter**. The answer includes the proposed action with Approve / Edit / Reject. Nothing is sent yet.
7. **Approvals.** Select **Review in Approvals**. Check the target, permission, rendered issue, raw fields, evidence, and side effects. (Optional: **Edit**, add the label `needs-triage`, **Save & re-validate** to see the Draft validation error, remove it, save again.)
8. **Approve.** Select **Approve & create issue**. The proposal shows **Executing** and its progress steps. Approve, Edit, and Reject stay locked until GitHub confirms.
9. **Succeeded.** After a few seconds: **Succeeded** + **Verified**, *Issue #42 created*, the verification checks, and links back to the project, evidence, conversation, and audit event. The Approvals badge count drops.
10. **Activity.** Open **Activity**. The newest events are *Created and verified issue lab/rag-experiments#42* and *Approved proposal …*. Use the category chips (for example **Errors**) and the expandable details.

### Other states to try

| State | How |
|---|---|
| No evidence | Ask `What learning rate did the GraphRAG paper use for fine-tuning?` |
| Conflicting sources | Ask `Does a chunk size above 512 tokens hurt retrieval quality?` |
| Model error + Retry | Ask anything containing `simulate error` |
| Cancelled partial answer | Select **Stop** while an answer streams |
| Failed ingestion + Retry | *Knowledge → Sources* → `survey-scan-2019.pdf` → **Retry** (it fails again: password-protected) |
| Source still processing | Open *Late Interaction Retrieval at Scale* from Sources |
| Memory review | *Knowledge → Memory*: Confirm, Edit, ··· → Mark superseded by…, Delete… |
| Decision timeline | *Projects → RAG Comparison*: confirm the proposed D-05 |
| Workspace deletion dialog | *Settings → Data deletion → Delete workspace data…* |
| Search | Press `Ctrl+K` (`⌘K` on macOS) and type `hybrid` |
| Onboarding | Sign in as `new@example.edu`, use *Prototype: use the sample paper* |
| Phone layout | Narrow the window below 768 px: bottom navigation; Graph becomes a list |

## Project layout

```
apps/web/                 React 19 + TypeScript + Vite + Tailwind CSS v4 + Radix (shadcn-style) + React Router 7 + TanStack Query + React Flow
  src/app/                router (one lazy chunk per screen), error route
  src/components/ui/      primitives: button, field, dialog, menu, switch/checkbox
  src/components/common/  StatusBadge, OriginBadge, CitationChip, EvidencePassage, states, toast, upload dropzone
  src/components/shell/   AppShell, TopBar, Sidebar (240 px ↔ 64 px rail), mobile nav, help
  src/features/<screen>/  pages, components, hooks per feature
  src/services/           mock REST + SSE over an in-memory store seeded from fixtures
packages/contracts/
  types/                  one file per entity (PRD §10) + SSE events
  fixtures/               JSON per endpoint (PRD §14) — generated by scripts/generate-fixtures.mjs
docs/
  PRD.md, UI.md           product and UI specifications
  API-CONTRACT.md         the contract the Go backend implements
  design/SCREENS.md       image → screen → route → components → data, plus design/doc differences
  AUDIT.md                web interface audit and UI.md §12 checklist
CLAUDE.md                 working rules for this repository
```

Rules that hold everywhere: components never import JSON (only `services/core/fixtures.ts` does); no raw hex in components (tokens from UI.md §2); statuses always have text or an icon; nothing shows success before the service confirms it.
