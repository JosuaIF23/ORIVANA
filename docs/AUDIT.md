# ORIVANA prototype — audit (Phase 7 and Phase 8)

Scope: everything under `apps/web/src`. Method: the Vercel Web Interface Guidelines (via the `web-design-guidelines` skill), automated greps, keyboard and screen-reader spot checks in the browser, a 1440 × 900 and 375 × 812 visual pass, and a side-by-side comparison with every image in `docs/design/screens/`.

## 1. Web Interface Guidelines — findings and fixes

Findings from phases 3–6 were fixed in those phases. This table lists everything found in the full audit plus the earlier fixes, so the record is complete.

| Area | Finding | Fix | Status |
|---|---|---|---|
| Forms | Submitting an invalid form didn't move focus to the error | `focusFirstInvalid()` on sign-in, sign-up, reset request, set new password | Fixed (phase 3) |
| Forms | Field errors were not announced | `aria-live="polite"` on field errors (`Field`) | Fixed (phase 3) |
| Forms | Editing a proposal could be lost by navigating away | `useBlocker` confirm dialog + `beforeunload` while edits are unsaved | Fixed (phase 6) |
| Forms | Inputs need `name`/`autocomplete`; emails need `spellCheck={false}` | Added to every input; auth inputs use real `autocomplete` tokens, the others `off` | Pass |
| Focus | `outline-none` on the composer textarea and the search palette input | Replaced with a 2 px accent ring on the container (`focus-within`) | Fixed (phase 7) |
| Focus | Global focus ring | `:focus-visible` 2 px `accent-primary`, 2 px offset (UI.md §2); React Flow nodes and edges included | Pass |
| Focus | Sticky top bar could cover focused items | `scroll-padding-top` = top bar + 16 px | Pass |
| Accessibility | Skip link missing on auth and onboarding layouts | Added "Skip to content" to `AuthLayout` and onboarding | Fixed (phase 7) |
| Accessibility | Memory status used `role="tablist"` without arrow-key support | Changed to a `role="group"` of `aria-pressed` buttons | Fixed (phase 5) |
| Accessibility | Icon-only buttons | All have `aria-label` (zoom, close, collapse, citation chips, row menus) | Pass |
| Accessibility | Status by colour only | `StatusBadge` always shows text + icon; candidates also use a dashed border; graph candidates are dashed + "Candidate" label | Pass |
| Accessibility | Graph alternative | List view (table) and the mobile relationship list; nodes/edges have `aria-label`s | Pass |
| Accessibility | Search palette | `combobox` + `listbox`/`option`, `aria-activedescendant`, ↑ ↓ Enter Esc | Pass |
| Typography | `...` instead of `…`; loading labels | Every placeholder and loading label uses `…` ("Signing in…", "Loading memories…") | Pass |
| Typography | Numbers in columns | `tabular-nums` (`.tabular`) on counts, pages, times, confidence | Pass |
| Typography | Heading widows | `text-wrap: balance` on h1–h3 | Fixed (phase 3) |
| Content | Long titles overflow flex rows | `min-w-0` + `truncate` on titles; memory table content column has a minimum width | Fixed (phase 5) |
| Content | Empty strings/arrays | Every list has an empty state (sources, memory, graph, approvals, activity, search, conversations) | Pass |
| Animation | Reduced motion | Global `prefers-reduced-motion` rule; only `transition-colors`, `transform`, and the progress bar `width` animate | Pass |
| Animation | `transition: all` | None | Pass |
| Navigation & state | Filters, tabs, pagination, selection in the URL | Sources, Graph (view/filters/selection/focus), Memory, Activity, Approvals tab, Assistant citation (`?m=&c=`), Settings section | Pass |
| Navigation & state | Destructive actions confirm | Delete source/memory/workspace/account, revoke GitHub, clear candidates, reject proposal all use a dialog that names what is removed | Pass |
| Touch | Double-tap delay, tap highlight, overscroll in dialogs | `touch-action: manipulation`, transparent tap highlight, `overscroll-contain` in dialogs and the palette | Fixed (phase 3) |
| Layout | Safe areas | Mobile bottom nav pads `env(safe-area-inset-bottom)` | Pass |
| Theming | `color-scheme`, `theme-color`, native `<select>` colours | `color-scheme: dark`, `theme-color` = `bg-app`, selects use `bg-app` + `text-fg` | Pass |
| Locale | Hard-coded date formats | All dates/times use `Intl.DateTimeFormat` in `Asia/Jakarta` (`lib/format.ts`) | Pass |
| Locale | Brand names translated | `translate="no"` on the wordmark and the assistant byline | Pass |
| Performance | Bundle size | Every screen is a lazy route chunk; React Flow loads only with the Graph; page content and SSE recordings are lazy-loaded fixtures | Pass |
| Performance | Lists > 50 items | Paginated (sources 8, relationships 12, activity 10 + "Load older events") | Pass |
| Copy | Guideline asks for Title Case | **Not applied, on purpose:** the design and UI.md use sentence case ("Sign in", "Create an account"). The design wins (CLAUDE.md "Sources of truth"). | Deviation |

Automated checks (re-run before the final commit): no raw hex in components, no `...` in UI strings, no `onClick` on `div`/`span`/`li`/`tr`, no white text on the accent, no component file over 200 lines, no `<img>`.

## 2. UI acceptance checklist (UI.md §12)

| # | Item | Result | Evidence |
|---|---|---|---|
| 1 | Navigation is consistent across screens and matches §3 | Pass | One `AppShell`; items Home, Assistant, Knowledge, Projects, Approvals (badge), Activity, Integrations, Settings; no Automations |
| 2 | Tagline and category match PRD exactly | Pass | Sign in page, auth footer, `index.html` description |
| 3 | User can identify the current workspace and project | Pass | Workspace switcher; project in the Assistant header and composer scope; breadcrumbs on project and document pages |
| 4 | Search results show type and source | Pass | Palette and `/search`: type icon + label, project/match, date, grouped by type |
| 5 | Assistant citations open the relevant page and passage | Pass | Citation → evidence panel → "Open in document · p. 6" → page 6 with the quoted span highlighted and a banner back to the answer |
| 6 | Graph nodes and edges expose provenance | Pass | Edge inspector: origin, confidence, extraction method/date, evidence passages with "Open in document"; entity inspector links to the source |
| 7 | Candidate relationships are visually distinct without relying on color | Pass | Dashed line + "Candidate" label on the canvas; dashed "Candidate" badge with icon in lists |
| 8 | Memory can be confirmed, edited, superseded, and deleted | Pass | Memory table actions + dialogs; decision timeline confirm/edit/reject; covered by service tests |
| 9 | Action preview shows exact target and side effects | Pass | Approvals review: target account, repository, permission, rendered preview, raw fields, side effects |
| 10 | Approval and rejection produce visible state changes | Pass | Executing → Succeeded + Verified; Rejected view; badge count and Decided count update; Activity records both |
| 11 | Integration scopes are understandable | Pass | Plain-language permission list with the raw scope beside each |
| 12 | Empty/loading/error states are designed | Pass | All six states from "Empty loading error states.png" plus per-screen states; "needs reconnect" is driven by `connections/list.needs-reconnect.200.json` |
| 13 | Keyboard navigation and focus states work | Pass | Tab order checked on auth, Home, Assistant (Enter sends, Shift+Enter newline), Graph (nodes/edges focusable), palette (↑ ↓ Enter Esc), dialogs (focus trap, Esc) |
| 14 | Text contrast ≥ 4.5:1; control borders ≥ 3:1 | Pass | Only UI.md §2 tokens are used (`text-muted` 4.8:1; inputs use `border-control` 3.2:1) |
| 15 | Assistant screen never shows four full columns with the expanded sidebar | Pass | Assistant, Graph, and Document viewer force the 64 px rail; the expand control opens the sidebar as an overlay |
| 16 | Mobile layout does not force a dense graph canvas | Pass | < 768 px shows the relationship list and bottom navigation |
| 17 | No screen implies an action succeeded before the backend confirms it | Pass | Toasts fire only in `onSuccess`; approvals poll until `verified_at`; uploads show live job stages |

## 3. Comparison with the design images

Every screen was opened at 1440 × 900 (Graph mobile at 375 × 812) next to its image. Remaining intentional differences are listed in `docs/design/SCREENS.md` §3. Fixes made during the comparison:

- Onboarding: "Recommended" is accent text, not a badge; ingestion progress counts all stages.
- Assistant: evidence heading fits one line; the thread no longer jumps to the bottom on load.
- Sources: project names don't wrap.
- Graph: collision-free layout (pill widths from label length).
- Memory: table fits 1440 px without horizontal scroll.
- Project: decision codes don't wrap; recent changes use "6 Nov", not "Fri".
- Approvals: facts grid uses three columns.
- Search: dates use "6 Nov" like the design.
- Integrations: capability badges wrap under the title on narrow widths; Google Drive tile shows "D".
- Settings: section nav stays visible (sticky); section titles are 24 px.

## 4. Bugs found by the test loop

| Phase | Bug | Fix |
|---|---|---|
| 3 | Step 3 spun forever when the source was missing | Error state with "Upload it again" |
| 3 | Textarea refilled with the suggestion after clearing | `null` vs empty string state |
| 3 | Regenerated fixtures were not picked up by the dev server | `fs.allow` + documented restart (README) |
| 4 | Thread scrolled to the bottom on first load | Scroll only for new or streaming messages |
| 5 | Graph nodes overlapped | Rectangle-aware collision pass |
| 6 | Activity showed "10 of 36" for "Last 7 days" | Fixture keeps all 46 events in the 7-day window |
| 6 | Unsaved-changes guard fired after a successful save | Guard skipped once the save is confirmed |
| 7 | Asking from Home stuck on "Retrieving sources…" (StrictMode remount consumed the stream) | Streams stay open until finished, like an SSE reconnect; regression test added |

---

# Phase 8 (v2.0) audit

## 5. Web Interface Guidelines — v2 files

Rules: vercel-labs/web-interface-guidelines `command.md`, fetched again for this phase. Files reviewed: `features/{matrix,claims,decisions,zotero}/*`, `features/integrations/{zotero-card,integrations-page}.tsx`, `features/settings/model-preferences.tsx`, `features/assistant/{save-decision-sheet,review-notice,message-actions}.tsx`, `features/home/decisions-review-card.tsx`, `features/projects/project-knowledge.tsx`, `features/onboarding/zotero-first-card.tsx`, `features/sources/removed-in-zotero.tsx`, `components/common/{evidence-compare,review-state-badge,source-type-badge,model-label}.tsx`, `components/ui/sheet.tsx`, `components/shell/mobile-nav.tsx`, `features/approvals/proposal-origin.tsx`.

| Finding | Fix |
|---|---|
| `EmptyState` icon wrapper was announced to screen readers | `aria-hidden="true"` on the wrapper (`components/common/states.tsx`) |
| Search inputs in Matrix, Claims, and Decisions had no `name` / `autocomplete` | `name` + `autoComplete="off"` |
| Sticky Decision Impact action bar could cover the focused link or button | `scroll-margin-bottom` on links and buttons in that page |
| Model names could be machine-translated | `translate="no"` on model names (ModelLabel, ModelPicker) |
| Placeholders without an ellipsis | "Search methods or datasets…", "Search claims…" |
| Knowledge tab strip showed a vertical scrollbar on desktop (`-mb-px` + `overflow-x-auto`) | Overflow only below `md` |
| Side sheet entrance animated opacity, so a paused or background tab showed it faded | Transform-only keyframe, behind `motion-safe` |

Checked and passing: icon-only buttons have labels; decorative icons are `aria-hidden` (EvidenceCompare, InlineAlert, and menu icons sit inside hidden wrappers); actions are `<button>` and navigation is `Link`; no `transition-all` or `outline-none`; dates use `Intl.DateTimeFormat`; counts use tabular numbers; sheets and dialogs use `overscroll-behavior: contain`; destructive actions (Revoke Zotero, Delete from ORIVANA, Delete decision) confirm first; filters, the selected cell or claim, and the open decision live in the URL.

Not applied, on purpose: the guideline's Title Case for headings and buttons. UI.md and the existing screens use sentence case, and CLAUDE.md makes the documents the source of truth.

## 6. UI acceptance checklist (UI.md v2 §12)

| # | Item | Result | Where / how verified |
|---|---|---|---|
| 1 | Navigation matches §3.2; Knowledge tabs are Sources · Matrix · Claims · Map · Memory | Pass | Sidebar, `KnowledgeHeader`; `/knowledge/graph` redirects to `/knowledge/map` |
| 2 | Tagline and category match PRD exactly | Pass | Unchanged from Phase 7 (sign-in, README) |
| 3 | Current workspace and project are always identifiable | Pass | Workspace switcher; project selectors on Matrix and Claims; project on every decision row |
| 4 | Search results show type and source | Pass | New Claims group; Zotero sources labelled "Source · Zotero" |
| 5 | Every citation opens the right page and passage | Pass | Citations as before; Matrix, Claims, and Decision Impact evidence open the viewer with `hl=` highlight and a Back banner |
| 6 | Matrix shows filled, candidate, and gap cells without colour alone | Pass | Count + chips / dashed border + "Candidate" / dashed "—" + "Gap · No evidence"; legend; cell `aria-label` |
| 7 | Every Matrix cell and Claim opens its evidence | Pass | MatrixInspector (gaps explain why, candidates listed separately); ClaimInspector |
| 8 | Supports / Contradicts / Candidate / Needs review follow §2.3 | Pass | ✓ / ✕ icons + text, dashed candidates, ReviewStateBadge with alert icon, superseded struck through (StatusBadge) |
| 9 | Decisions show status, review state, rationale, dependencies, history | Pass | Memory → Decisions rows and the decision sheet |
| 10 | Decision Impact review shows old vs new evidence and the three actions | Pass | `/decision-alerts/:id`: EvidenceCompare + Keep / Revise / Propose action |
| 11 | A decision alert can produce a proposal that appears in Approvals with its origin | Pass | Browser run: Propose action → Approvals (3 pending) → "Origin: From Decision Impact alert…" |
| 12 | Action preview shows exact target and side effects; no success before confirmation | Pass | Unchanged review screen; Executing → Succeeded + Verified only after `verified_at`; then "Linked to decision D-04" |
| 13 | Zotero is clearly read-only | Pass | Import dialog, Sources header note, Integrations card ("Not granted: change or delete…"), onboarding, Home |
| 14 | Model used is visible on answers; model preference is changeable | Pass | "Answered with Claude Sonnet 5.5"; Settings → Model preferences; test: preference change → `model_name` on the next answer |
| 15 | Integration scopes are understandable | Pass | Plain-language scope lists on the Zotero and GitHub cards |
| 16 | Empty, loading, and error states for every new screen | Pass | Matrix, Claims, decisions view, decision sheet, Decision Impact (loading, resolved read-only, source deleted), import dialog, Model preferences |
| 17 | Keyboard navigation works, including Matrix cells | Pass | Roving tab stop; arrow keys, Home, End (browser check: ArrowLeft moved focus) |
| 18 | Contrast: text ≥ 4.5:1, controls ≥ 3:1 | Pass | Only existing tokens; warning and danger text on their 5–15 % tints, as in Phase 7 |
| 19 | Assistant never shows four full columns with the expanded sidebar | Pass | Unchanged; Matrix, Claims, and Map also use the rail |
| 20 | Mobile never forces a dense graph or a wide table | Pass | 375 px: Matrix becomes a list grouped by method (no horizontal scroll), Claims are cards, Map is a list, Decision Impact stacks |

## 7. Bugs found while testing Phase 8

| Bug | Fix |
|---|---|
| The Zotero import progress never left "Importing…": the poll invalidated the `connections` key prefix, which also matched its own key, cancelling itself in a loop | Sync key moved to `['zotero-sync', id]`; invalidation runs once in an effect after the sync finishes |
| Matrix inspector said "1 paper tested Hybrid on HotpotQA" for a cell shown as a gap | Candidate papers are listed under "Candidate evidence · not counted yet" unless Include candidates is on |
| Zotero library label repeated the account name | Fixture label is "My Library" |
| Decision edit overwrote the statement with the title | Editing a decision changes its title only |
