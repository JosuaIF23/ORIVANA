# ORIVANA — Product Blueprint

**Tagline:** Your Knowledge, Connected. Your Intent, in Motion.
**Category:** Personal Intelligence & Action Platform
**Version:** 1.1 (11 November 2026)

This folder contains the product requirements and UI/UX design specification.

- [PRD.md](PRD.md) — product vision, brand, differentiation, target users, MVP and milestones, flows, architecture, data model, security, API, roadmap, and risks.
- [UI.md](UI.md) — visual direction and tokens, navigation, screen specifications, interactions, accessibility, design workflow, and prompts for design tools.

## Locked MVP decisions

| Decision | Choice |
|---|---|
| Initial persona | Researchers and postgraduate students who use GitHub |
| First connector | GitHub (read repos/issues; create issue behind approval) |
| Write policy | Every write action requires explicit approval |
| Navigation | Home, Assistant, Knowledge (Sources/Graph/Memory), Projects, Approvals, Activity, Integrations, Settings |
| Automations | Post-MVP (hidden behind a feature flag) |
| Backend | Go modular monolith + Python PDF parsing worker |
| Data | PostgreSQL + pgvector + graph tables; River job queue |
| Streaming | `POST` message → `GET` SSE stream via `EventSource` |

## Recommended workflow

1. Validate the ORIVANA name through formal trademark, domain, company-name, and social-handle checks.
2. Run Phase 0 (`PRD.md` §18): interviews, evaluation set, model choice, PDF parsing test.
3. Freeze the MVP scope and milestones in `PRD.md` §6.
4. Explore visual directions with the staged prompts in `UI.md` §10 (Google Stitch or an alternative).
5. Refine the chosen design in Figma (tokens as variables, components with states).
6. Build a React + TypeScript prototype with v0 or a coding agent using `UI.md` §11.
7. Implement the Go backend against the API and data contracts in `PRD.md`, milestone by milestone (M1 → M6).

ORIVANA is a working brand candidate. The name has not been legally cleared.
