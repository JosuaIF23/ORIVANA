# ORIVANA — Product Blueprint

**Tagline:** Your Knowledge, Connected. Your Intent, in Motion.\
**Category:** Personal Intelligence & Action Platform\
**Version:** 2.0 (12 November 2026)

> NotebookLM helps you read your papers. Perplexity helps you search the web.\
> **ORIVANA keeps your research decisions honest — and moves them forward.**

## What ORIVANA is

ORIVANA helps researchers keep their decisions aligned with the evidence in their own papers, and act on it with control:

1. **Understand** — Matrix (methods × datasets, with gaps), Claims (supported vs contradicted), Map; every item linked to the exact page.
2. **Decide** — decisions recorded with rationale, evidence, and history.
3. **Watch** — **Decision Impact**: when a new paper contradicts a claim a decision depends on, the decision is flagged.
4. **Act** — follow-up actions (e.g. a GitHub issue) are previewed and run only after approval, then verified and audited.

ORIVANA works **within the user's own collection** (Zotero library and uploads). It complements discovery tools (Google Scholar, ResearchRabbit, Perplexity) and Zotero rather than replacing them.

## Documents

- [PRD.md](PRD.md) — positioning, competitors, users, scope, feature specs, flows, architecture, data model, API, MCP server, validation, roadmap, risks.
- [UI.md](UI.md) — tokens, navigation, all screens (including Matrix, Claims, Decision Impact), components, accessibility, Claude Design prompt, Claude Code Phase 8 prompt, demo script.

## Locked MVP decisions

| Decision | Choice |
|---|---|
| Persona | Postgraduate researcher who uses Zotero and GitHub |
| Sources | Upload (PDF/MD/TXT) + **Zotero (read-only)** |
| Action connector | GitHub (read + create issue) |
| Write policy | Every write needs explicit approval |
| Search scope | Within the user's collection only (no web search in MVP) |
| Knowledge views | Sources · **Matrix · Claims · Map** · Memory |
| Flagship feature | **Decision Impact** |
| AI access | Server-side **Model Gateway** with API keys; multi-provider; user chooses the answer model |
| Navigation | Home, Assistant, Knowledge, Projects, Approvals, Activity, Integrations, Settings |
| Backend | Go modular monolith + Python PDF parser |
| Data | PostgreSQL + pgvector + graph tables; River job queue |
| Streaming | `POST` message → `GET` SSE stream |
| Post-MVP highlights | ORIVANA **MCP server** (Claude, ChatGPT), gap-driven discovery, supervisor sharing, BYOK, automations |

## Status

| Item | Status |
|---|---|
| Blueprint (this folder) | v2.0 |
| UI design (Claude Design, 35 artboards) | Done; v2 additions listed in `UI.md` §9.2 |
| Frontend prototype (Claude Code, mock JSON) | Phases 0–7; **Phase 8** next (`UI.md` §11) |
| Phase 0 validation interviews | To do (`PRD.md` §20.1) |
| Backend (Go) | Not started |
| Name clearance | Not done |

## Workflow

1. Finish and commit frontend Phase 7.
2. Replace `docs/PRD.md`, `docs/UI.md`, `docs/README.md` with v2.0.
3. (Optional) Design the v2 artboards in Claude Design with `UI.md` §10; export PNGs to `docs/design/screens/`.
4. Run Claude Code **Phase 8** with `UI.md` §11.
5. Run Phase 0 interviews (`PRD.md` §20.1) — go/no-go on the wedge before backend work.
6. Build the backend in Go against `docs/API-CONTRACT.md`, milestone by milestone (`PRD.md` §7.4).
7. Validate the name (trademark, domain, company name, social handles).

## Demo in one line

Zotero sync → new paper contradicts a claim → decision flagged → evidence compared → GitHub issue proposed → approved → verified → visible in Activity.

ORIVANA is a working brand candidate. The name has not been legally cleared.
