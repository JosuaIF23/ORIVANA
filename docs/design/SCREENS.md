# ORIVANA — Screen inventory

Peta dari setiap gambar di `docs/design/screens/` ke screen, route, komponen, dan data.
Sumber kebenaran: gambar = layout, susunan, teks, komponen · `UI.md` §2 = warna, font, ukuran, spacing · `PRD.md` §12/§17/§11.5 (v2.0) = bentuk data. Screen v2 tanpa artboard mengikuti `UI.md` §4 (lihat §4 di bawah).

- Semua nama file gambar sudah jelas; tidak ada screen yang harus ditebak dari isi. Yang ditandai **(tebakan)** adalah detail yang tidak terlihat utuh di gambar.
- Route **tidak** didefinisikan di dokumen mana pun; semua route di bawah adalah usulan untuk Fase 0.
- "Rail" = sidebar aplikasi tampil sebagai icon rail 64 px. "Sidebar" = sidebar 240 px penuh.
- Tanggal "sekarang" untuk semua fixture: **Rabu, 11 November 2026, 15:10** (lihat Perbedaan #1).

## 1. Tabel screen

| # | File gambar | Screen | Route | Komponen utama yang terlihat | Data yang ditampilkan |
|---|---|---|---|---|---|
| 1 | `1 · Design system.png` | Design system (referensi) | — (opsional `/dev/design-system`) | Color swatches, type scale, spacing/radius, Button (primary/secondary/ghost/danger × default/hover/focus/disabled/small+icon/loading) | Token UI.md §2, type scale 32/24/20/16/14/12 + mono 12, radius 4 badge · 6 control · 8 card, spacing 8–64. Gambar terpotong di 4000 px (komponen di bawah Buttons tidak terlihat) |
| 2 | `Shell · Sidebar (shared, expanded + rail).png` | AppShell — Sidebar | semua route app | WorkspaceSwitcher (avatar JS, "Personal workspace", Owner), SidebarNavigation 7 item + Settings di bawah, badge Approvals | `me.workspace` (name, role), jumlah pending approvals |
| 3 | `Shell · TopBar (shared).png` | AppShell — TopBar | semua route app | Logo + wordmark, GlobalSearch trigger "Search anything… ⌘K", Help, Notifications (dot), Avatar | `me.user` (inisial), status notifikasi belum dibaca |
| 4 | `10 · Sign in.png` | Sign in | `/sign-in` | AuthLayout (logo kiri atas, footer kategori + Privacy/Terms), form Email/Password (eye toggle), link Forgot password, primary Sign in, link Create an account, catatan "Signing in never connects your other apps…" | — (form kosong) |
| 5 | `Sign in · invalid credentials + email not verified.png` | Sign in — error states | `/sign-in` (state) | InlineAlert danger "Email or password is incorrect" + sisa percobaan; field error "Password doesn't match this email."; InlineAlert warning "Verify your email to continue" + Resend verification email + "use a different email" | Error `INVALID_CREDENTIALS` (`details.attempts_left`=3, jeda 10 menit); error `EMAIL_NOT_VERIFIED` (email, tanggal kirim) |
| 6 | `Sign up.png` | Sign up | `/sign-up` | Form Name (optional), Email, Password + PasswordStrengthMeter 4 segmen, checkbox Terms/Privacy, primary Create account, catatan verifikasi | Nilai form contoh (Josua Silalahi, josua@example.edu) |
| 7 | `Check your email.png` | Check your email | `/check-email` | Card ikon mail, 3 langkah bernomor, Resend email (disabled + countdown 0:42), "Wrong address? Change email", link prototype "open the verification link →" | Email tujuan, masa berlaku 24 jam, cooldown resend |
| 8 | `Reset password · flow + states.png` | Reset password (4 state) | `/reset-password` → `/reset-password/sent` → `/reset-password/new?token=…` (expired: token `expired`) | 4 kartu: Request link, Link sent, Choose a new password (+ strength), This link has expired (+ rate limit 3/jam) | Email, masa berlaku 30 menit, `RATE_LIMITED` (retry 18 menit), `TOKEN_EXPIRED` |
| 9 | `11 · Onboarding 1 · Welcome + use case.png` | Onboarding 1 — Welcome | `/onboarding/welcome` | OnboardingStepper (Welcome / First source / First question) + Skip setup, radio cards use case (Research Recommended; 2 × Coming later), input nama project, Skip for now / Continue to upload | Nama user, daftar use case, nama project default "RAG Comparison" |
| 10 | `Onboarding 2 · First paper + ingestion.png` | Onboarding 2 — First paper | `/onboarding/source` | UploadDropzone, IngestionProgressCard (badge Indexing, progress bar, 4 langkah), 3 kartu "What ORIVANA extracts", Privacy and memory (2 Switch), baris Connect GitHub, footer Back / Skip / Continue | Source + job (`Embedding 48 of 86 chunks`), preferensi memory, status koneksi GitHub |
| 11 | `Onboarding 3 · Try a cited question.png` | Onboarding 3 — Try a cited question | `/onboarding/question` | Status siap (✓ 14 pages, 86 passages), 3 SuggestedQuestion, textarea pertanyaan + Ask, CitationChip contoh, Back / Finish and go to Home | Source siap, pertanyaan yang disarankan |
| 12 | `5 · Home.png` | Home / Command Center | `/home` (`/` → redirect) | PageHeader (greeting, tanggal · workspace, Add a source), CommandInput "Ask your knowledge" + project select + Ask, ProjectCard ×2, Recently added sources (SourceStatusBadge), Pending approvals card, Suggested next steps, Recent activity, Connector health | `me`, projects (2), sources terbaru (4), proposals pending (2), saran (2), audit events (4), connections (GitHub) |
| 13 | `Home · empty state (new user).png` | Home — empty state | `/home` (user tanpa source) | EmptyState "Upload your first paper", UploadDropzone + Browse files, "What happens next" 3 langkah, catatan privasi; badge Approvals tidak tampil | `me` (user baru, 0 source, 0 proposal) |
| 14 | `2 · Assistant.png` | Assistant | `/assistant/:conversationId` | Rail, ConversationList 280 px (filter, grup Today/This week/Earlier, new, collapse), ChatHeader (judul, project, ···), UserMessage, AssistantMessage (CitationChip [1][2][3], Limitations callout, Sources cited), Composer (attach, project select, scope, Send), EvidencePanel 360 px (navigasi citation 2 of 3, metadata, passage ter-highlight, Open in document · p. 6, Other passages) | Conversations (6), conversation `Hybrid vs dense-only results` + messages + message_citations (3), chunk passage + offset highlight |
| 15 | `Assistant · state · Retrieving sources.png` | Assistant — retrieving | `/assistant/:id` (state streaming) | StreamStatus (spinner + "12 passages found in 5 sources"), checklist 3 langkah, skeleton jawaban, chip sumber ber-passage, Composer dengan Stop | SSE `status` events (`retrieving` + counts + sources), lalu `generating` |
| 16 | `Assistant · state · No evidence found.png` | Assistant — no evidence | `/assistant/:id` (state) | NoEvidenceCard (ikon search-minus warning), closest passage + CitationChip, aksi Add a source / Search all workspace sources (31), tip | Message `answer_kind: no_evidence`, 1 citation "closest passage" |
| 17 | `Assistant · state · Conflicting sources.png` | Assistant — conflicting | `/assistant/:id` (state) | Badge "Sources disagree", 2 PositionCard (A/B) dengan quote ter-highlight + citation, InferenceNote dashed "ORIVANA inference — not stated by either source", MessageActions (Copy, Open source, Explore relationship, Flag incorrect) | Message `answer_kind: conflicting` dengan `positions[]`, `inference` |
| 18 | `6 · Knowledge → Sources.png` | Knowledge → Sources | `/knowledge/sources` | KnowledgeHeader + tabs, header Sources (31 · 14) + Upload, UploadDropzone, filter (Search, Project, Status, Type, Table/List), SourceTable (ikon, title + penulis·tahun, project, status + sub-progres, pages, added, menu ···), baris Failed + Retry, pagination | Sources (8 dari 14), jobs (Indexing 212/340, Parsing 9/22, Queued, Failed attempt 2 of 3) |
| 19 | `Sources · document viewer.png` | Source detail / DocumentViewer | `/knowledge/sources/:sourceId?page=6&from=…` | Rail, breadcrumb, PageNavigator (Page 6 of 14), SectionOutline, CitationOriginBanner ("Opened from citation 2 in …" + Back to answer), halaman dokumen (heading, passage ter-highlight, tabel), panel kanan: metadata, Extracted entities (chip ber-ikon), Relationships created (StatusBadge), Ingestion history, Reprocess, Delete source… | Source detail, chunks per halaman/section, entities (11), relationships (6), job attempts |
| 20 | `3 · Knowledge → Graph.png` | Knowledge → Graph | `/knowledge/graph` | Rail, GraphFilters (entity type + jumlah, status, project, source, date, Reset), toolbar (Find in graph, Focus on, 1/2 hops, 25 nodes · 30 edges, Graph/List), GraphCanvas (node pill ber-ikon, edge solid/dashed + label Candidate, edge terpilih), zoom controls, legend, RelationshipInspector (from → USES_METHOD → to, badge Candidate + Model-proposed, confidence, extraction, evidence passages, Confirm/Reject) | Subgraph (25 node, 30 edge), relationship detail + evidence_links |
| 21 | `Knowledge → Graph · List view.png` | Knowledge → Graph (list) | `/knowledge/graph?view=list` | Filter relationship type + status + project, GraphListView (From, Relationship, To, Status, Evidence, Conf.; candidates first), pagination 1–12 of 30, inspector yang sama | Relationships (12 dari 30) |
| 22 | `Graph · mobile (list first).png` | Graph — mobile | `/knowledge/graph` (< 768 px) | Mobile header (logo + search), tabs, catatan canvas, kartu relasi (verb berwarna accent), BottomNav (Projects, Assistant, Upload, Approvals 2, Activity) | Relationships (5 untuk review) |
| 23 | `7 · Knowledge → Memory.png` | Knowledge → Memory | `/knowledge/memory` | Header + Add memory, SegmentedTabs status ber-count, filter Type/Project, Search memories, MemoryTable dikelompokkan (Needs review · 3 / Confirmed · 4 of 5), OriginBadge, link evidence, StatusBadge, aksi Confirm/Edit/Reject/···, menu (Edit, Mark superseded by…, View related memories, Delete…), catatan superseded | Memories (11: 3 candidate, 5 confirmed, 1 superseded, 2 rejected) |
| 24 | `8 · Project workspace.png` | Project workspace — Overview | `/projects/:projectId` (tab lain: `/projects/:projectId/:tab`) | Breadcrumb, judul + Active, Edit project, Ask about this project, tabs ber-count, kartu Current status / Recent changes / Key decisions, DecisionTimeline (D-05 proposed … D-01; superseded dicoret + link pengganti), Pending actions, Related sources | Project detail, decisions (memories type project / decision: D-01–D-05), proposals pending, sources |
| 25 | `4 · Approvals · review.png` | Approvals — review | `/approvals/:proposalId` (`/approvals` membuka yang pertama) | Tabs Pending 2 / Decided 14, ProposalList (risk badge), review: judul + Awaiting approval, facts grid (target, action, risk, repo, permission, project), original request, rendered preview, Raw fields JSON, Evidence used, Expected side effects, footer Reject / Edit / Approve & create issue | Action proposals (2 pending), detail `prop_01JC9X4M7Q` (arguments_json, citations, side effects) |
| 26 | `Approvals · state · Edit (Draft).png` | Approvals — Edit (Draft) | `/approvals/:proposalId/edit` | Back to review, badge Draft, InlineAlert info, select Repository, Title*, Body Markdown + counter, label chips (label tidak valid dashed + peringatan), ringkasan perubahan + rev, footer Discard / Approve (disabled) / Save & re-validate | Draft proposal, repo yang diizinkan, label repo yang ada, `VALIDATION_FAILED` (label `needs-triage`) |
| 27 | `Approvals · state · Executing.png` | Approvals — Executing | `/approvals/:proposalId` (state) | Badge Executing, kartu "Creating the issue on GitHub…", ProgressSteps 5 langkah (AgentRunTimeline), ringkasan, footer terkunci + tombol loading | Action run (attempt 1, timestamps) |
| 28 | `Approvals · state · Succeeded + Verified.png` | Approvals — Succeeded + Verified | `/approvals/:proposalId` (state) | Badge Succeeded + Verified, kartu sukses (Issue #42) + Open issue on GitHub / Back to Approvals, Verification result (4 cek), Linked back to (project, evidence, conversation, audit event) | Action run `succeeded`, `external_ref`, hasil verifikasi, audit event `evt_7f3a91` |
| 29 | `Approvals · state · Rejected.png` | Approvals — Rejected | `/approvals/:proposalId` (state) | Badge Rejected, kartu "Nothing was sent to GitHub", textarea Reason, audit event + idempotency key retired, Open conversation / Back to Approvals | Proposal `rejected`, reason, audit event `evt_7f3a9c` |
| 30 | `9 · Integrations.png` | Integrations | `/integrations` | IntegrationCard GitHub (Connected, capability badges, repo chips, PermissionScopeList 4 baris, catatan token, Reconnect / Revoke access…), kartu Coming later (Obsidian sync, Google Drive), "How connecting works" | Connection GitHub (akun, tanggal, sync, repos, scopes), provider coming later |
| 31 | `12 · Activity.png` | Activity | `/activity` | Header + Export log (CSV), FilterChips 7 kategori ber-count, Actor/When select, search, "Showing 10 of 46", timeline dikelompokkan per hari, ActivityRow (waktu, actor, kategori, deskripsi + link, status, expand), detail error (code, message, job, request ID, related, Fix in Sources, Copy details), Load older events | Audit events (10 dari 46) |
| 32 | `13 · Settings · memory, export, deletion.png` | Settings — Memory controls / Export / Deletion | `/settings/:section` (default `memory`) | SettingsNav 9 section, Switch rows, select retensi, Clear all candidates…, kartu export (isi, format, Start export, last export + Link expired), kartu deletion 3 baris | Preferensi memory, export terakhir, ringkasan data |
| 33 | `Settings · delete confirmation dialog.png` | Settings — delete workspace dialog | `/settings/deletion` (dialog) | ConfirmDialog destruktif: daftar "Permanently deleted" + jumlah, "Not affected", link Export, input ketik nama workspace, Cancel / Delete workspace data | Deletion preview (31 sources, 2,140 chunks, 186 · 412, 11 · 6, 23, 2, GitHub revoked) |
| 34 | `Global search · grouped results.png` | Global search | Palet ⌘K (overlay) + `/search?q=` | Dialog pencarian, hasil dikelompokkan (Sources, Entities & concepts, Memories & decisions, Conversations), kolom tipe (ikon + label), sub (project · match), tanggal, hint keyboard, scope | Hasil `POST /search` untuk "hybrid" (7; hasil ke-7 tidak terlihat **(tebakan: project atau action)**) |
| 35 | `Empty loading error states.png` | Kumpulan state | dipakai di route terkait | Graph empty, Memory "You're all caught up", Memory loading skeleton, Assistant model error (Retry answer / Show passages), Assistant cancelled (partial answer + Regenerate), Integrations needs reconnect | Error `MODEL_TIMEOUT`, message `cancelled`, connection `needs_reconnect` |

## 2. Screen tanpa gambar (diturunkan dari dokumen)

| Screen | Route | Dasar |
|---|---|---|
| Email verified → masuk onboarding | `/verify-email?token=…` | UI.md §4.2; tautan "Prototype: open the verification link →" |
| Projects list | `/projects` | UI.md §3; memakai ProjectCard dari Home |
| Project tabs selain Overview | `/projects/:projectId/:tab` | UI.md §4.9 (Sources, Graph, Memories & decisions, Conversations, Actions, Timeline) |
| Approvals — Decided list | `/approvals?tab=decided` | UI.md §4.10 |
| Proposal inline di Assistant | di dalam `/assistant/:id` | UI.md §4.10 akhir; memakai gaya ActionProposalCard |
| Assistant — source inaccessible | state di `/assistant/:id` | UI.md §4.5 |
| Settings section lain (Profile, Security & sessions, dll.) | `/settings/:section` | UI.md §4.13; dibuat ringkas |
| Not found | `*` | — |

## 3. Perbedaan gambar vs dokumen (dan antar-gambar) — keputusan

| # | Perbedaan | Keputusan |
|---|---|---|
| 1 | Activity memakai "Today · Thursday 12 November", sedangkan Home "Wednesday, 11 November 2026" dan Approvals "expires 18 Nov 2026" (7 hari dari 11 Nov). | Satu jam mock: 11 Nov 2026. Grup Activity menjadi "Today · Wednesday 11 November" dan "Yesterday · Tuesday 10 November". |
| 2 | Global search menampilkan Claim dengan ikon lingkaran; Graph memakai diamond untuk Claim dan lingkaran untuk Method. UI.md §4.6 mewajibkan tiap tipe punya ikon/bentuk sendiri. | Ikuti dokumen: Claim = diamond di semua tempat. |
| 3 | Graph: checkbox "Show candidates" tercentang di gambar; UI.md §4.6 berkata candidate edges "hidden by default". | Ikuti dokumen: default tidak tercentang. Link "Review 5 candidate relationships" di Home membuka graph dengan candidate tampil (`?candidates=1`). |
| 4 | Sources: filter Project = RAG Comparison, tetapi baris gagal `survey-scan-2019.pdf` milik Thesis Proposal. | Default filter Project = "All projects", sehingga baris Failed + Retry tetap muncul secara logis. |
| 5 | UI.md §2 menyebut icon rail hanya untuk Assistant; gambar Graph dan Document viewer juga memakai rail. | Ikuti gambar; sesuai "column budget rule" UI.md §2 (layar dengan ≥ 3 kolom internal memakai rail). |
| 6 | Onboarding judul "Welcome, Josua" tampak > 32 px. | Ikuti skala UI.md §2: maksimum 32 px. |
| 7 | Memory: tab "Needs review" aktif tetapi grup Confirmed juga tampil. | Ikuti UI.md §4.8: default "Needs review di atas, lalu confirmed". Tab lain memfilter penuh. |
| 8 | Assistant: chip related entities (UI.md §4.5) tidak terlihat (terpotong); MessageActions hanya terlihat di state conflicting. | Tambahkan related entities dan MessageActions di bawah setiap jawaban selesai. |
| 9 | Rejected: Approvals memakai danger, Activity memakai netral. | Satu StatusBadge: Rejected = danger + ikon ✕ di semua tempat. |
| 10 | Mobile bottom nav: Projects, Assistant, Upload, Approvals, Activity; UI.md §7 juga menyebut Search. | Ikuti gambar; Search tersedia lewat ikon di header mobile (sesuai gambar). |
| 11 | Design system terpotong di 4000 px. | Komponen yang tidak terlihat mengikuti UI.md §5 dan pola dari screen lain. |
| 12 | Beberapa data di gambar tidak punya endpoint di PRD §14: suggested next steps (Home), preferensi memory (Settings, Onboarding 2), sesi aktif (Settings), deletion preview + hapus data workspace (dialog), ekspor log Activity (CSV), daftar repo + label GitHub (Edit proposal), reconnect connection. | Diusulkan sebagai tambahan di `docs/API-CONTRACT.md` dan ditandai "extension"; butuh persetujuan (lihat rencana Fase 0). |
| 13 | Document viewer shows Okafor → BEIR as **Candidate**, but Home, Graph, and mobile all say there are **5** candidates in RAG Comparison. | Kept 5 candidates everywhere (Okafor → BEIR is confirmed). |
| 14 | Activity "Yesterday 09:12 Uploaded Hybrid Retrieval Under Distribution Shift" conflicts with that paper being added on 3 Nov. | Yesterday's upload event is Dense-Only Baselines (10 Nov). Older ingestion events are "Re-indexed … with the updated embedding model" so all 46 events fit "Last 7 days". |
| 15 | Approvals lists "12 min" for a proposal created at 14:34; the mock clock is 15:10. | Ages are computed from the clock ("36 min"). |
| 16 | Sign in, Check your email, and Reset password show "Prototype: …" links in the design. | Kept, plus "Prototype: fill the demo account" on Sign in and "Prototype: use the sample paper" in onboarding; demo accounts live in `fixtures/auth/_test-accounts.json`. |
| 17 | The design has no Projects list screen or proposal-inline-in-chat screen. | Built from existing components (ProjectCard; Approvals controls inside the answer). |
| 18 | v2 Matrix example (UI.md §4.7) shows **Hybrid × HotpotQA** as a gap, but Varga & Chen 2024 has a *candidate* `uses_method → Hybrid` relationship and evaluates on HotpotQA. | Matrix defaults to confirmed relationships only (PRD §8.4 "confirmed only / include candidates"). Hybrid × HotpotQA is a gap by default; with **Include candidates** on it becomes a dashed "Candidate" cell. Same rule for GraphRAG × HotpotQA (Ito's HotpotQA relation is still a candidate), so that cell differs from the UI.md example until candidates are included. |
| 19 | Matrix citations [1]–[4] (Santos, Okafor, Varga, Ito) need method × dataset pairs the v1 graph (25 nodes · 30 edges) doesn't contain (e.g. Okafor × NQ/BEIR, Santos × BM25/Dense). | Extra relationships live in the relationship store but outside the focused Map subgraph, so Map keeps 25 · 30 and the 5-candidate count stays true. |
| 20 | v2 memory status `proposed` vs v1 `candidate`. | Additive: `MemoryStatus` gains `proposed`. Decisions use `proposed`; other memory types keep `candidate`. |
| 21 | v1 `GET /memories?status=needs_review` means "candidates to review"; v2 "Needs review" means `review_state = needs_review` (Decision Impact). | The old query keeps its meaning. New optional query `review_state=needs_review`; the v2 UI uses it. Memory's v1 "Needs review" segment becomes "Proposed". |
| 22 | D-04 title in v1 is "Use hybrid retrieval (BM25 + dense, RRF k = 60) as the default retriever"; the v2 flagship needs "Use hybrid retrieval for thesis experiments". | D-04 is retitled in fixtures; the RRF detail moves to its statement/rationale. Project timeline and search show the new title. |
| 23 | Varga & Chen 2024 must be a Zotero import that newly contradicts the claim; v1 shows it as an upload on 10 Nov 16:40 and as evidence for D-02. | Varga becomes `type: zotero`, synced on 10 Nov 16:40 (same time, so v1 conversations that cite it still make sense). Activity: Zotero sync → extraction (the existing 16:42 timeout + retry) → decision alert 16:45. D-02's evidence moves to another paper. |
| 24 | Mobile bottom nav: v1 artboard Projects · Assistant · Upload · Approvals · Activity; UI.md v2 §7 Home · Assistant · Knowledge · Approvals · More. | Follow the document (replaces #10). Upload stays reachable from Knowledge → Sources; Projects, Activity, Integrations, Settings go under More. |
| 25 | Activity v1 chips include `tool_calls`; the v2 filter list has Proposals and no Tool calls. | Additive: categories `zotero_sync`, `extraction`, `decision_alerts`, `proposals` are added; `tool_calls` stays and its chip shows only when it has events. |
| 26 | v1 Home has a "Suggested next steps" card; UI.md v2 §4.4 lists seven Home cards without it. | Follow v2: the card is no longer on Home (the extension endpoint stays). Its jobs moved to the Decisions needing review card and the Matrix/Claims candidate review. |
| 27 | Plan §4.3 named the route `/settings/models`; v1 already had the section key `model`. | Kept `/settings/model` so existing links keep working. |
| 28 | UI.md v2 §4.12 lists a Matrix tab per project but no layout for it. | The project tab embeds the same MatrixGrid (confirmed only); a cell opens Knowledge → Matrix with that cell selected. |
| 29 | Decision Impact review is "a full-width page with sidebar"; its actions need to stay reachable on long pages. | A sticky action bar at the bottom of the page (above the mobile bottom navigation). |

## 4. Fase 8 — rencana v2.0 (8.0, belum ada kode)

Dasar: UI.md §0, §4, §5, §9.2, §11–§13; PRD §7–§9, §12, §17. Belum ada artboard v2 di `docs/design/screens/`, jadi semua screen v2 diturunkan dari dokumen.

### 4.1 Perbedaan v1.1 → v2.0 yang menyentuh kode

| Area | v1 sekarang | v2.0 |
|---|---|---|
| Knowledge tabs | Sources · Graph · Memory | Sources · **Matrix · Claims · Map** · Memory |
| Home | Ask, projects, sources, approvals, suggestions, activity, connectors | + **Decisions needing review** (urutan UI.md §4.4), badge Home di sidebar, badge PDF/Zotero di sources |
| Assistant | Jawaban + citations | + "Answered with <model>", **Save as decision**, "Explore in Claims", notice decision needs review |
| Sources | PDF/MD/TXT, status sampai Ready | + type **Zotero**, status **Extracting**, Import from Zotero, "Removed in Zotero" |
| Memory | Semua memory per status | **Decisions first**, review state, dependencies, history, detail sheet |
| Decision Impact | — | Halaman review baru: Keep / Revise / Propose action |
| Project | 7 tab v1 | Overview · Sources · Matrix · Claims · Decisions · Conversations · Actions · Activity; alert di timeline |
| Approvals | Origin = conversation | + Origin "From Decision Impact alert", "Linked to decision" |
| Integrations | GitHub + coming later | Zotero (read-only) · GitHub · MCP "Coming later" · Obsidian/Drive/Notion coming later |
| Settings | 9 section | + **Model preferences** |
| Activity | 7 kategori | 10 filter UI.md §4.15 |
| Onboarding 2 | Upload dulu | **Connect Zotero (recommended)** dulu |
| Mobile nav | Projects · Assistant · Upload · Approvals · Activity | Home · Assistant · Knowledge · Approvals · More |
| Global search | 4 grup | + grup Claims (UI.md §3.3) |

### 4.2 Kontrak (8.1) — hanya tambahan

Types baru di `packages/contracts/types/`: `matrix.ts`, `claim.ts`, `decision-alert.ts`, `model.ts`, `zotero.ts`.

| Type | Isi pokok |
|---|---|
| `MatrixResponse` | `methods[]`, `datasets[]`, `papers[]` (nomor citation [1]…[n]), `cells[]` {method_id, dataset_id, paper_ids, status confirmed/candidate, metric?}; gap = pasangan tanpa cell |
| `MatrixCellDetail` | judul sel, papers + passages (page, section, quote, offsets), relationships + status/confidence, `related_claim_ids` |
| `Claim` / `ClaimDetail` | `statement`, `short_name` (nama entity di Map), status, supports/contradicts/mentions counts, `used_by_decisions[]` {id, title, review_state}; detail: evidence per stance + `context_note` {text, generated_by: model} |
| `DecisionAlert` | memory_id + title, claim_id + statement, trigger_source_id, trigger_relationship_id, severity weakens/uncertain, reason, confidence, status open/dismissed/resolved, resolution_note, detected_at, `previous_evidence[]`, `new_evidence[]`, proposal_id |
| `AnswerModel` | id, name, provider, tier fast/strong, description |
| `ZoteroCollection` + sync | key, name, parent_key, item_count, pdf_count; sync {collection_keys, project_id} → progress per item |

Field opsional baru pada type lama:

| Type | Tambahan |
|---|---|
| `Memory` | `kind`, `title`, `rationale`, `review_state`, `dependencies[]`, `decided_at`, `history[]` (objek `decision` lama tetap) |
| `MemoryStatus` | `proposed` |
| `MemoryListQuery` | `review_state`, `kind` |
| `CreateMemoryRequest` | `kind`, `title`, `rationale`, `status`, `dependencies`, `evidence`, `from_message_id`, `supersedes_id` |
| `Source` | type `zotero`, status `extracting`, `zotero` {collection_name, item_key, last_synced_at, removed_in_zotero} |
| `Message` | `model`, `model_name` |
| `Preferences` | `answer_model`, `theme`, `notifications` |
| `MeResponse.counts` | `decisions_needing_review` |
| `ActionProposal` | `origin` {type assistant/decision_alert/manual, id, label}, `linked_decision` {id, title} |
| `ToolConnection` | provider `zotero` (+ collections_synced, last_sync_at) |
| `AuditCategory` | `zotero_sync`, `extraction`, `decision_alerts`, `proposals` |
| Search | tipe/grup `claim` |
| `Project.counts` | `matrix`, `claims`, `decisions`, `activity` |

Endpoint baru (mock + `API-CONTRACT.md`): `GET /models` · `GET /knowledge/matrix` · `GET /knowledge/matrix/cell` · `GET /claims` · `GET/PATCH /claims/{id}` · `PUT /memories/{id}/dependencies` · `GET /decision-alerts` · `PATCH /decision-alerts/{id}` · `POST /decision-alerts/{id}/propose-action` · `GET /connections/zotero/collections` · `POST /connections/zotero/sync`. Extension (tidak ada di PRD, ditandai): `PATCH /sources/{id}` untuk "Keep" pada Removed in Zotero.

Fixtures (lewat generator): `matrix.mjs`, `claims.mjs`, `alerts.mjs`, `models.mjs`, `zotero.mjs`, plus perubahan di `sources`, `memories`, `actions`, `audit`, `conversations`, `misc`.

Cerita flagship di fixtures:
- Decision **D-04 "Use hybrid retrieval for thesis experiments"** (confirmed, `review_state: needs_review`) bergantung pada claim **"Hybrid retrieval outperforms dense-only retrieval on open-domain QA"**.
- Supports: Santos & Lee 2025 (p. 4) dan Okafor et al. 2025 (p. 6). Contradicts (baru): **Varga & Chen 2024 (p. 9, §5)**, impor Zotero.
- Satu alert `open`, severity **Weakens**. "Propose action" membuat proposal GitHub "Re-evaluate retrieval choice for multi-hop questions" dengan origin alert, jadi pending 2 → 3.
- Matrix: baris BM25 · Dense retrieval · Hybrid · GraphRAG; kolom Natural Questions · TriviaQA · HotpotQA · BEIR; gap Hybrid × HotpotQA (lihat #18).
- Models: dua per provider (fast/strong); default answer model di preferences.

### 4.3 Services, hooks, routes

| Lapisan | Rencana |
|---|---|
| services | `matrix.ts`, `claims.ts`, `decision-alerts.ts`, `models.ts`, `zotero.ts`; perluas `memories`, `sources`, `proposals`, `workspace`, `stream` (message.model), `audit`, `search` |
| hooks | hook per fitur + query keys baru; mutasi meng-invalidasi badge Home/Approvals |
| routes | `/knowledge/matrix` (rail), `/knowledge/claims` (rail, `?claim=`), `/knowledge/map` (rail; `/knowledge/graph` → redirect dengan query), `/knowledge/memory?decision=` (sheet), `/decision-alerts/:alertId` (sidebar penuh), `/settings/model` (lihat #27); tab project lama `graph` → `/knowledge/map`, `memories` → `decisions`, `timeline` → `activity` |

### 4.4 Komponen

Baru (UI.md §5): MatrixGrid, MatrixCell, MatrixInspector, MatrixMobileList, ClaimCard, ClaimInspector, EvidenceCompare, ReviewStateBadge, SourceTypeBadge, DecisionAlertCard, DecisionImpactView (+ Keep dialog, Revise sheet), DecisionDetailSheet, SaveAsDecisionSheet, ZoteroImportDialog, ModelLabel, ModelPicker, McpConnectCard, ZoteroCard, MapLegend, mobile More menu.

Diubah: KnowledgeHeader (5 tab), Graph → Map (+ legend), tabel Memory (decisions first), Home, Sidebar/MobileNav, tab + timeline Project, ProposalReview (origin), RunViews (linked decision), tabel/filter Sources, step-source Onboarding, Integrations, nav Settings, chip Activity, hasil GlobalSearch, actions/byline pesan Assistant, StatusBadge (proposed, extracting, needs review).

### 4.5 Urutan sub-fase dan cek

| Sub-fase | Isi | Selesai bila |
|---|---|---|
| 8.1 | Types, generator, fixtures, services, tes, `API-CONTRACT.md` | `npm test` lulus (angka tes diperbarui + tes baru alert → proposal), build bersih, screen v1 tetap jalan |
| 8.2 | Knowledge tabs, Map + legend + redirect, Matrix, Claims | Matrix bisa dinavigasi panah, list mobile, CSV; Claims compare; console bersih |
| 8.3 | Memory decisions-first, Decision Impact review, Home card + badge, alert/tab Project, label model + Save as decision di Assistant, origin/linked di Approvals | Keep/Revise/Propose jalan lewat mock; tidak ada sukses sebelum konfirmasi |
| 8.4 | Zotero (Sources, dialog, Removed), Onboarding 2, Integrations, Model preferences, Activity, mobile nav, Claims di search | Zotero tertulis read-only di setiap tempat |
| 8.5 | web-design-guidelines, checklist UI.md §12 (pass/fail), demo README sesuai UI.md §13 | Alur flagship bisa diklik dari Home sampai Activity |

Risiko yang dipantau: komponen > 200 baris (Assistant, Memory, Approvals sudah besar, jadi dipecah), angka di tes (pending 2 → 3 setelah propose, audit 46 + event v2, hitungan memory), dan konsistensi waktu fixture terhadap jam mock 11 Nov 2026 15:10.

