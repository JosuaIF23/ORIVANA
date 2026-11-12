// Sources, jobs, source detail, and page-based document content.
import { PASSAGES } from './passages.mjs';
import { t, tOct, write, error, NOW } from './lib.mjs';

const RAG = ['prj_rag', 'RAG Comparison'];
const THESIS = ['prj_thesis', 'Thesis Proposal'];
const NONE = [null, null];

// [id, title, authors, short, year, type, project, status, pages, sizeMB, created]
const CATALOG = [
  ['src_daly2025', 'Chunking Strategies for Dense Retrieval', 'Daly', 'Daly 2025', 2025, 'pdf', RAG, 'indexing', 18, 3.4, t('13:58')],
  ['src_meyer2024', 'Late Interaction Retrieval at Scale', 'Meyer', 'Meyer 2024', 2024, 'pdf', RAG, 'parsing', 22, 4.1, t('13:57')],
  ['src_ito2025', 'GraphRAG: Community Summaries for Global Questions', 'Ito', 'Ito 2025', 2025, 'pdf', RAG, 'queued', null, 2.7, t('13:57', 11, 30)],
  ['src_survey2019', 'survey-scan-2019.pdf', null, 'survey-scan-2019.pdf', 2019, 'pdf', THESIS, 'failed', null, 8.9, t('08:30')],
  ['src_varga2024', 'Dense-Only Baselines for Multi-hop QA', 'Varga & Chen', 'Varga & Chen 2024', 2024, 'pdf', RAG, 'ready', 16, 2.2, t('16:40', 10)],
  ['src_labnotes', 'lab-notes-november.md', null, 'lab-notes-november.md', null, 'markdown', RAG, 'ready', null, 0.02, t('10:05', 10)],
  ['src_rao2025', 'Graph-Aware Retrieval for Scientific Literature', 'Rao & Lindgren', 'Rao & Lindgren 2025', 2025, 'pdf', THESIS, 'ready', 19, 3.0, t('20:15', 8)],
  ['src_thesisoutline', 'thesis-outline-v2.md', null, 'thesis-outline-v2.md', null, 'markdown', THESIS, 'ready', null, 0.01, t('19:40', 8)],
  ['src_weber2024', 'Knowledge Graphs Meet Dense Retrieval', 'Weber', 'Weber 2024', 2024, 'pdf', THESIS, 'ready', 14, 2.5, t('11:00', 6)],
  ['src_alvarez2025', 'Temporal Knowledge in RAG Systems', 'Alvarez et al.', 'Alvarez et al. 2025', 2025, 'pdf', THESIS, 'ready', 17, 2.9, t('09:20', 5)],
  ['src_supervisornotes', 'supervisor-notes-oct.md', null, 'supervisor-notes-oct.md', null, 'markdown', THESIS, 'ready', null, 0.01, t('14:10', 4)],
  ['src_okafor2025', 'Hybrid Retrieval Under Distribution Shift', 'Okafor, Brandt & Ruiz', 'Okafor et al. 2025', 2025, 'pdf', RAG, 'ready', 14, 2.1, t('09:12', 3)],
  ['src_santos2025', 'Fusion Retrieval Revisited: BM25 + Dense on Open-Domain QA', 'Santos & Lee', 'Santos & Lee 2025', 2025, 'pdf', RAG, 'ready', 11, 1.8, t('15:30', 1)],
  ['src_kowalski2024', 'Reciprocal Rank Fusion for Neural Retrievers', 'Kowalski', 'Kowalski 2024', 2024, 'pdf', RAG, 'ready', 9, 1.2, tOct('10:00', 30)],
  ['src_lindqvist2024', 'BEIR Revisited: Zero-Shot Retrieval Benchmarks', 'Lindqvist & Moreau', 'Lindqvist & Moreau 2024', 2024, 'pdf', RAG, 'ready', 20, 3.6, tOct('16:20', 28)],
  ['src_haddad2025', 'ColBERT-Style Late Interaction for Scientific QA', 'Haddad', 'Haddad 2025', 2025, 'pdf', RAG, 'ready', 15, 2.4, tOct('13:45', 27)],
  ['src_nakamura2025', 'Sparse–Dense Hybrids in Low-Resource Domains', 'Nakamura', 'Nakamura 2025', 2025, 'pdf', RAG, 'ready', 12, 1.9, tOct('09:10', 25)],
  ['src_brennan2024', 'Evaluating Retrieval-Augmented Generation: A Survey', 'Brennan et al.', 'Brennan et al. 2024', 2024, 'pdf', RAG, 'ready', 34, 5.2, tOct('15:00', 22)],
  ['src_osei2025', 'Entity-Aware Retrieval for Long-Tail Questions', 'Osei & Park', 'Osei & Park 2025', 2025, 'pdf', RAG, 'ready', 13, 2.0, tOct('11:30', 20)],
  ['src_fischer2024', 'Query Rewriting for Multi-hop Retrieval', 'Fischer', 'Fischer 2024', 2024, 'pdf', RAG, 'ready', 10, 1.4, tOct('10:15', 18)],
  ['src_kim2025', 'Prompt Injection Risks in Retrieval Pipelines', 'Kim', 'Kim 2025', 2025, 'pdf', NONE, 'ready', 12, 1.7, tOct('14:00', 16)],
  ['src_patel2025', 'Embedding Model Benchmarks 2025', 'Patel', 'Patel 2025', 2025, 'pdf', NONE, 'ready', 21, 3.3, tOct('09:45', 15)],
  ['src_novak2024', 'Vector Databases in Practice', 'Novak', 'Novak 2024', 2024, 'pdf', NONE, 'ready', 18, 2.8, tOct('16:10', 14)],
  ['src_readinglist', 'reading-list.md', null, 'reading-list.md', null, 'markdown', NONE, 'ready', null, 0.01, tOct('20:30', 13)],
  ['src_duarte2025', 'Citation Accuracy in LLM Answers', 'Duarte', 'Duarte 2025', 2025, 'pdf', NONE, 'ready', 11, 1.5, tOct('13:20', 12)],
  ['src_sato2025', 'Hallucination Detection via Evidence Alignment', 'Sato', 'Sato 2025', 2025, 'pdf', NONE, 'ready', 13, 2.0, tOct('10:40', 10)],
  ['src_mbeki2024', 'Re-ranking with Cross-Encoders', 'Mbeki', 'Mbeki 2024', 2024, 'pdf', NONE, 'ready', 10, 1.3, tOct('15:25', 9)],
  ['src_ivanova2025', 'Document Parsing for Scientific PDFs', 'Ivanova', 'Ivanova 2025', 2025, 'pdf', NONE, 'ready', 16, 2.6, tOct('11:50', 8)],
  ['src_seminarnotes', 'seminar-notes.txt', null, 'seminar-notes.txt', null, 'txt', NONE, 'ready', null, 0.01, tOct('17:05', 7)],
  ['src_grant2025', 'Long-Context Models versus Retrieval', 'Grant', 'Grant 2025', 2025, 'pdf', NONE, 'ready', 14, 2.2, tOct('09:30', 6)],
  ['src_costa2024', 'Benchmarking Hybrid Search Engines', 'Costa', 'Costa 2024', 2024, 'pdf', NONE, 'ready', 17, 2.7, tOct('14:45', 5)],
];

const FALLBACK_PAGES = { src_ito2025: 12 };

// v2: items imported read-only from Zotero (PRD §8.2). Varga & Chen 2024 is the
// flagship "new contradicting paper", synced on 10 Nov 16:40 (SCREENS.md #23).
export const ZOTERO_LIBRARY = { id: 'zlib_4417302', label: 'josua-silalahi · My Library' };
export const ZOTERO_LAST_SYNC = t('09:00');
const ZC_RAG = ['ZC7K2RAG', 'RAG Comparison'];
const ZOTERO_ITEMS = {
  src_varga2024: [ZC_RAG, 'VRG24CHN', 412, 3],
  src_kowalski2024: [ZC_RAG, 'KWL24RRF', 377, 0],
  src_lindqvist2024: [ZC_RAG, 'LDQ24BEI', 371, 5],
  src_haddad2025: [ZC_RAG, 'HDD25COL', 366, 1],
  src_nakamura2025: [ZC_RAG, 'NKM25SDH', 352, 0],
};
const REMOVED_IN_ZOTERO = new Set(['src_nakamura2025']);

const MD_SECTIONS = { src_labnotes: 6, src_thesisoutline: 5, src_supervisornotes: 3, src_readinglist: 4 };

function jobFor(id, status, pages, created) {
  const base = {
    id: `job_${id.slice(4, 12)}`,
    workspace_id: 'ws_personal',
    source_id: id,
    kind: 'ingest',
    attempts: 1,
    max_attempts: 3,
    progress: null,
    eta_seconds: null,
    error_code: null,
    error_message: null,
    started_at: created,
    finished_at: null,
  };
  if (id === 'src_daly2025') return { ...base, status: 'running', stage: 'indexing', progress: { current: 212, total: 340, unit: 'chunks' }, eta_seconds: 90 };
  if (id === 'src_meyer2024') return { ...base, status: 'running', stage: 'parsing', progress: { current: 9, total: 22, unit: 'pages' }, eta_seconds: 60 };
  if (id === 'src_ito2025') return { ...base, status: 'queued', stage: 'queued', started_at: null };
  if (id === 'src_survey2019')
    return {
      ...base,
      id: 'job_01JC8ZP3',
      status: 'failed',
      stage: 'failed',
      attempts: 2,
      error_code: 'PDF_ENCRYPTED',
      error_message: 'Parsing failed: the PDF is password-protected. Remove the password and re-upload, or retry if you already did.',
      finished_at: t('11:12'),
    };
  return { ...base, status: 'succeeded', stage: 'ready', finished_at: created, progress: pages ? { current: pages, total: pages, unit: 'pages' } : null };
}

function chunkCount(pages, type) {
  if (type !== 'pdf') return 12;
  return pages ? Math.round(pages * 6.2) : null;
}

export const SOURCES = CATALOG.map(([id, title, authors, short, year, type, [project_id, project_name], status, pages, mb, created]) => {
  const fileName = type === 'pdf' && authors ? `${title}.pdf` : title;
  const sections = MD_SECTIONS[id] ?? (pages ? Math.min(10, Math.max(6, Math.round(pages / 2))) : null);
  return {
    id,
    workspace_id: 'ws_personal',
    project_id,
    project_name,
    type,
    title,
    file_name: fileName,
    authors,
    short_label: short,
    year,
    status,
    checksum: `sha256:${id.slice(4, 8)}${'9c41a7e2b05d'.slice(0, 8)}…e07b`,
    size_bytes: Math.round(mb * 1024 * 1024),
    page_count: status === 'ready' || status === 'indexing' || status === 'parsing' ? pages : null,
    section_count: status === 'ready' || status === 'indexing' ? sections : null,
    chunk_count: status === 'ready' ? chunkCount(pages, type) : status === 'indexing' ? 340 : null,
    created_at: created,
    updated_at: status === 'failed' ? t('11:12') : created,
    job: jobFor(id, status, pages, created),
    zotero: null,
  };
});

for (const source of SOURCES) {
  const z = ZOTERO_ITEMS[source.id];
  if (!z) continue;
  const [[collection_key, collection_name], item_key, item_version, annotation_count] = z;
  source.type = 'zotero';
  source.zotero = {
    library_id: ZOTERO_LIBRARY.id,
    item_key,
    item_version,
    collection_key,
    collection_name,
    last_synced_at: ZOTERO_LAST_SYNC,
    has_pdf: true,
    annotation_count,
    removed_in_zotero: REMOVED_IN_ZOTERO.has(source.id),
  };
}

// Real checksum shape for the source shown in the document viewer.
SOURCES.find((s) => s.id === 'src_okafor2025').checksum = 'sha256:9c41…e07b';
SOURCES.find((s) => s.id === 'src_okafor2025').chunk_count = 86;
SOURCES.find((s) => s.id === 'src_okafor2025').section_count = 10;

const byId = Object.fromEntries(SOURCES.map((s) => [s.id, s]));

// --- Sections ---------------------------------------------------------------

const OKAFOR_SECTIONS = [
  ['1', 'Introduction', 1, 1],
  ['2', 'Related work', 2, 1],
  ['3', 'Method', 3, 1],
  ['4', 'Experiments', 5, 1],
  ['4.1', 'Setup', 5, 2],
  ['4.2', 'Results', 6, 2],
  ['4.3', 'Ablations', 8, 2],
  ['5', 'Discussion', 10, 1],
  ['6', 'Conclusion', 12, 1],
  [null, 'References', 13, 1],
];

const CUSTOM_SECTIONS = {
  src_okafor2025: OKAFOR_SECTIONS,
  src_santos2025: [['1', 'Introduction', 1, 1], ['2', 'Setup', 2, 1], ['3', 'Results', 4, 1], ['3.1', 'Main results', 4, 2], ['3.2', 'Fusion parameters', 6, 2], ['4', 'Analysis', 7, 1], ['5', 'Conclusion', 9, 1], [null, 'References', 10, 1]],
  src_varga2024: [['1', 'Introduction', 1, 1], ['2', 'Method', 2, 1], ['2.1', 'Retrievers', 2, 2], ['2.2', 'Experimental setup', 3, 2], ['3', 'Results', 5, 1], ['4', 'Error analysis', 7, 1], ['5', 'Discussion', 9, 1], ['6', 'Conclusion', 13, 1], [null, 'References', 14, 1]],
  src_daly2025: [['1', 'Introduction', 1, 1], ['2', 'Background', 2, 1], ['3', 'Method', 3, 1], ['4', 'Experiments', 5, 1], ['4.1', 'Setup', 5, 2], ['4.2', 'Overlap', 6, 2], ['4.3', 'Chunk length', 7, 2], ['5', 'Discussion', 12, 1], ['6', 'Conclusion', 15, 1], [null, 'References', 16, 1]],
  src_meyer2024: [['1', 'Introduction', 1, 1], ['2', 'Related work', 2, 1], ['3', 'System design', 4, 1], ['4', 'Experiments', 7, 1], ['5', 'Results', 9, 1], ['6', 'Analysis', 11, 1], ['6.1', 'Chunk length', 11, 2], ['7', 'Conclusion', 18, 1], [null, 'References', 20, 1]],
};

const GENERIC = ['Introduction', 'Related work', 'Method', 'Experiments', 'Results', 'Discussion', 'Conclusion', 'References'];

function sectionsFor(source) {
  const custom = CUSTOM_SECTIONS[source.id];
  if (custom) return custom.map(([number, title, page, level], i) => ({ id: `sec_${source.id.slice(4)}_${i + 1}`, number, title, page, level }));
  if (source.type === 'markdown' || source.type === 'txt') {
    const n = MD_SECTIONS[source.id] ?? 3;
    const names = ['Summary', 'Experiments this week', 'Open questions', 'Decisions', 'Next steps', 'Links'];
    return names.slice(0, n).map((title, i) => ({ id: `sec_${source.id.slice(4)}_${i + 1}`, number: null, title, page: 1, level: 1 }));
  }
  const pages = source.page_count ?? FALLBACK_PAGES[source.id] ?? 10;
  const step = Math.max(1, Math.floor(pages / GENERIC.length));
  return GENERIC.map((title, i) => ({
    id: `sec_${source.id.slice(4)}_${i + 1}`,
    number: i < GENERIC.length - 1 ? String(i + 1) : null,
    title,
    page: Math.min(pages, 1 + i * step),
    level: 1,
  }));
}

// --- Page content -------------------------------------------------------------

const FILLER = {
  Introduction: 'Retrieval quality bounds the quality of retrieval-augmented answers: if the relevant passage is not retrieved, the generator cannot cite it. This section motivates the comparison and states the research questions.',
  'Related work': 'Prior work compares sparse and dense retrievers on open-domain question answering, but few studies hold the reader model fixed while varying only the retriever.',
  Method: 'We describe the retrievers, the indexing settings, and how passages are scored and merged before they are passed to the reader.',
  Experiments: 'All experiments use the same reader model and the same passage budget so that differences can be attributed to retrieval.',
  Setup: 'Hyperparameters are selected on the development split and frozen before evaluating on the test sets.',
  Results: 'We report top-20 accuracy and nDCG@10 for every configuration; confidence intervals come from 1,000 bootstrap samples.',
  Ablations: 'Removing the fusion step reduces accuracy on every subset, while changing the fusion constant has a smaller effect.',
  Discussion: 'The results suggest that lexical and semantic signals are complementary, but the size of the gain depends on the question type.',
  Conclusion: 'We summarise the findings and list the limitations of the evaluation, including the small number of multi-hop datasets.',
  References: '[1] Robertson, S. and Zaragoza, H. The probabilistic relevance framework. [2] Karpukhin, V. et al. Dense passage retrieval for open-domain question answering.',
};

const PASSAGES_BY_SOURCE = {};
for (const p of Object.values(PASSAGES)) {
  (PASSAGES_BY_SOURCE[p.source_id] ??= {});
  PASSAGES_BY_SOURCE[p.source_id][p.chunk_id] = p;
}

function fillerFor(sectionTitle) {
  return FILLER[sectionTitle] ?? FILLER[GENERIC.find((g) => sectionTitle.includes(g))] ?? FILLER.Discussion;
}

function buildPages(source) {
  const pageCount = source.page_count ?? FALLBACK_PAGES[source.id] ?? 1;
  const sections = sectionsFor(source);
  const cited = Object.values(PASSAGES_BY_SOURCE[source.id] ?? {});
  const pages = [];
  let ordinal = 0;
  for (let page = 1; page <= pageCount; page++) {
    const starting = sections.filter((s) => s.page === page);
    const current = [...sections].reverse().find((s) => s.page <= page) ?? sections[0];
    const blocks = [];
    const chunks = [];
    const addParagraph = (chunk_id, text, section) => {
      ordinal += 1;
      blocks.push({ type: 'paragraph', chunk_id, text });
      chunks.push({
        id: chunk_id,
        document_id: `doc_${source.id.slice(4)}`,
        ordinal,
        text,
        token_count: Math.round(text.split(' ').length * 1.3),
        page_start: page,
        page_end: page,
        section_path: [section.number ? `${section.number} ${section.title}` : section.title],
        char_start: ordinal * 1200,
        char_end: ordinal * 1200 + text.length,
      });
    };
    const sectionsHere = starting.length ? starting : [current];
    for (const section of sectionsHere) {
      if (starting.includes(section)) blocks.push({ type: 'heading', text: section.number ? `${section.number} ${section.title}` : section.title, level: section.level });
      const label = section.number ? `${section.number} ${section.title}` : section.title;
      const citedHere = cited.filter((p) => p.page === page && p.section === label);
      const uniqueCited = [...new Map(citedHere.map((p) => [p.chunk_id, p])).values()];
      if (uniqueCited.length) {
        uniqueCited.forEach((p, i) => {
          addParagraph(p.chunk_id, p.passage, section);
          if (source.id === 'src_okafor2025' && page === 6 && i === 0) {
            blocks.push({
              type: 'table',
              caption: 'Table 3 — Top-20 accuracy (%). Best per column in bold.',
              columns: ['Retriever', 'NQ', 'TriviaQA', 'BEIR (avg.)'],
              rows: [
                ['BM25', '62.9', '71.3', '48.1'],
                ['Dense only', '78.4', '79.0', '44.6'],
                ['Hybrid (RRF)', '82.0', '81.9', '51.7'],
              ],
              emphasis_row: 2,
            });
          }
        });
      } else {
        addParagraph(`chk_${source.id.slice(4)}_${String(page).padStart(2, '0')}${String(blocks.length).padStart(2, '0')}`, fillerFor(section.title), section);
      }
    }
    const header = source.authors ? `${source.authors} · ${source.title}` : source.title;
    pages.push({
      source_id: source.id,
      page,
      page_count: pageCount,
      running_header: header,
      section_id: current?.id ?? null,
      blocks,
      chunks,
    });
  }
  return pages;
}

// --- Detail ----------------------------------------------------------------------

const ENTITY_SETS = {
  src_okafor2025: {
    entities: [
      ['ent_m_hybrid', 'Hybrid retrieval', 'method'],
      ['ent_m_rrf', 'RRF', 'method'],
      ['ent_d_nq', 'Natural Questions', 'dataset'],
      ['ent_d_triviaqa', 'TriviaQA', 'dataset'],
      ['ent_d_beir', 'BEIR', 'dataset'],
      ['ent_c_hybridbeats', 'Hybrid beats dense-only', 'claim'],
      ['ent_c_lexicalaids', 'Lexical aids rare names', 'claim'],
      ['ent_k_lexical', 'Lexical matching', 'concept'],
      ['ent_k_shift', 'Distribution shift', 'concept'],
      ['ent_m_bm25', 'BM25', 'method'],
      ['ent_m_dense', 'Dense retrieval', 'method'],
    ],
    relationships: [
      ['rel_okafor_hybrid', 'uses_method', 'Hybrid retrieval', 'confirmed'],
      ['rel_okafor_triviaqa', 'evaluates_on', 'TriviaQA', 'confirmed'],
      ['rel_okafor_lexical', 'supports', 'Lexical aids rare names', 'confirmed'],
      ['rel_okafor_beir', 'evaluates_on', 'BEIR', 'confirmed'],
      ['rel_okafor_hybridbeats', 'supports', 'Hybrid beats dense-only', 'confirmed'],
      ['rel_okafor_rrf', 'uses_method', 'RRF', 'confirmed'],
    ],
  },
};

const SUGGESTED = {
  src_okafor2025: [
    'How much does hybrid retrieval improve over dense-only, and on which datasets?',
    'Which BEIR subsets do the authors use to test distribution shift?',
    'What limitations do the authors mention?',
  ],
};

function historyFor(source) {
  const s = source;
  if (s.status === 'failed') {
    return [
      { label: 'Uploaded & checksum verified', status: 'done', at: s.created_at },
      { label: 'Attempt 1 failed · password-protected PDF', status: 'failed', at: t('08:31') },
      { label: 'Attempt 2 failed · password-protected PDF', status: 'failed', at: t('11:12') },
    ];
  }
  if (s.id === 'src_okafor2025') {
    return [
      { label: 'Uploaded & checksum verified', status: 'done', at: t('09:12', 3) },
      { label: 'Parsed · 14 pages, 10 sections', status: 'done', at: t('09:12', 3, 40) },
      { label: 'Chunked & embedded · 86 chunks', status: 'done', at: t('09:13', 3) },
      { label: 'Entities extracted · attempt 2', status: 'done', at: t('09:15', 3) },
      { label: 'Attempt 1 timed out (model gateway)', status: 'failed', at: t('09:14', 3) },
    ];
  }
  const steps = [{ label: 'Uploaded & checksum verified', status: 'done', at: s.created_at }];
  if (s.page_count && s.status !== 'queued') steps.push({ label: `Parsed · ${s.page_count} pages`, status: 'done', at: s.created_at });
  if (s.status === 'ready') {
    steps.push({ label: `Chunked & embedded · ${s.chunk_count} chunks`, status: 'done', at: s.created_at });
    steps.push({ label: 'Entities extracted', status: 'done', at: s.created_at });
  }
  return steps;
}

export function detailFor(source) {
  const set = ENTITY_SETS[source.id];
  const entities = set ? set.entities.map(([id, name, entity_type]) => ({ id, name, entity_type })) : [];
  const relationships = set ? set.relationships.map(([id, relation_type, target_name, status]) => ({ id, relation_type, target_name, status })) : [];
  return {
    ...source,
    sections: source.status === 'failed' ? [] : sectionsFor(source),
    entities,
    entity_count: set ? 11 : source.status === 'ready' ? 4 : 0,
    relationships,
    relationship_count: set ? 6 : 0,
    ingestion_history: historyFor(source),
    suggested_questions: SUGGESTED[source.id] ?? [],
  };
}

export function generateSources() {
  write('sources/list.200.json', {
    _note: 'Mock store seed: the full workspace list. The real API pages this with next_cursor (default limit 8).',
    items: SOURCES,
    next_cursor: null,
    total: SOURCES.length,
    workspace_total: SOURCES.length,
  });
  write('sources/list.recent.200.json', {
    _note: 'GET /api/v1/sources?view=home&limit=4 — the Home "Recently added sources" card.',
    items: ['src_daly2025', 'src_survey2019', 'src_varga2024', 'src_okafor2025'].map((id) => byId[id]),
    next_cursor: null,
    total: 4,
    workspace_total: SOURCES.length,
  });
  write('sources/detail.200.json', {
    _note: 'GET /api/v1/sources/{id} keyed by id.',
    items: Object.fromEntries(SOURCES.map((s) => [s.id, detailFor(s)])),
  });
  for (const source of SOURCES.filter((s) => s.status !== 'failed')) {
    write(`sources/chunks/${source.id}.200.json`, {
      _note: `GET /api/v1/sources/${source.id}/chunks?page=N — one entry per page.`,
      pages: buildPages(source),
    });
  }
  const uploaded = {
    id: 'src_new_hybrid',
    workspace_id: 'ws_new',
    project_id: 'prj_new_rag',
    project_name: 'RAG Comparison',
    type: 'pdf',
    title: 'Hybrid Retrieval Under Distribution Shift',
    file_name: 'Hybrid Retrieval Under Distribution Shift.pdf',
    authors: 'Okafor, Brandt & Ruiz',
    short_label: 'Okafor et al. 2025',
    year: 2025,
    status: 'queued',
    checksum: 'sha256:9c41…e07b',
    size_bytes: 2202010,
    page_count: 14,
    section_count: null,
    chunk_count: null,
    created_at: NOW,
    updated_at: NOW,
    job: null,
    zotero: null,
  };
  const uploadJob = {
    id: 'job_01JCA2UP',
    workspace_id: 'ws_new',
    source_id: 'src_new_hybrid',
    kind: 'ingest',
    status: 'queued',
    stage: 'queued',
    attempts: 1,
    max_attempts: 3,
    progress: null,
    eta_seconds: null,
    error_code: null,
    error_message: null,
    started_at: null,
    finished_at: null,
  };
  write('sources/upload.201.json', { source: { ...uploaded, job: uploadJob }, job: uploadJob });
  write('sources/upload.413-too-large.json', error('VALIDATION_FAILED', 'Files can be up to 50 MB.', 'req_77ab02e9', { field: 'file', max_bytes: 52428800 }));
  write('sources/upload.403-email-not-verified.json', error('EMAIL_NOT_VERIFIED', 'Verify your email before uploading sources.', 'req_1f3d5a90'));
  write('sources/reprocess.202.json', {
    ...byId.src_survey2019.job,
    status: 'queued',
    stage: 'queued',
    attempts: 3,
    error_code: null,
    error_message: null,
    finished_at: null,
  });
  write('sources/delete.200.json', {
    deleted_source_id: 'src_okafor2025',
    removed: { chunks: 86, citations: 4, evidence_links: 9 },
    needs_review: { relationships: 2, memories: 1 },
  });
  write('sources/get.404.json', error('NOT_FOUND', 'Source not found.', 'req_c0ffee01'));
  for (const s of SOURCES.filter((x) => x.job && x.job.status !== 'succeeded')) {
    write(`jobs/${s.job.id}.200.json`, s.job);
  }
  write(`jobs/${uploadJob.id}.200.json`, uploadJob);
}
