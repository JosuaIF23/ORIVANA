// Passages that are cited in answers, graph evidence, and memories.
// Each passage is one chunk; `quote` is the highlighted span inside it.
import { span } from './lib.mjs';

export const PASSAGES = {
  okafor_p6: {
    chunk_id: 'chk_okafor_0601',
    source_id: 'src_okafor2025',
    page: 6,
    section: '4.2 Results',
    ...span(
      'Table 3 summarises retrieval accuracy on in-domain and shifted test sets. Combining BM25 with the dense retriever improves top-20 accuracy over the dense-only baseline on both Natural Questions (+3.6) and TriviaQA (+2.9), with the largest gains on the shifted BEIR subsets. We attribute most of this gain to lexical matching of rare entity names that the dense encoder under-represents.',
      'Combining BM25 with the dense retriever improves top-20 accuracy over the dense-only baseline on both Natural Questions (+3.6) and TriviaQA (+2.9), with the largest gains on the shifted BEIR subsets.',
    ),
  },
  okafor_p6_after: {
    chunk_id: 'chk_okafor_0602',
    source_id: 'src_okafor2025',
    page: 6,
    section: '4.2 Results',
    ...span(
      'Gains are smallest on questions whose answers appear in long, paraphrased passages, where the dense encoder already retrieves the relevant chunk. Section 4.3 isolates the contribution of the fusion step.',
      'Section 4.3 isolates the contribution of the fusion step.',
    ),
  },
  okafor_p5: {
    chunk_id: 'chk_okafor_0502',
    source_id: 'src_okafor2025',
    page: 5,
    section: '4.1 Setup',
    ...span(
      'We evaluate distribution shift on six BEIR subsets whose vocabulary differs from the training data, and report in-domain results on Natural Questions and TriviaQA for reference.',
      'We evaluate distribution shift on six BEIR subsets',
    ),
  },
  okafor_p10: {
    chunk_id: 'chk_okafor_1001',
    source_id: 'src_okafor2025',
    page: 10,
    section: '5 Discussion',
    ...span(
      'Lexical matching helps most when questions mention rare entity names, such as chemical compounds or people who appear only a handful of times in the training corpus.',
      'Lexical matching helps most when questions mention rare entity names',
    ),
  },
  santos_p4: {
    chunk_id: 'chk_santos_0401',
    source_id: 'src_santos2025',
    page: 4,
    section: '3.1 Main results',
    ...span(
      'Table 2 reports the main results on Natural Questions. With reciprocal rank fusion (k = 60), the BM25 + dense fusion raises top-20 accuracy on NQ from 78.4 to 82.5, a gain of 4.1 points over the dense-only baseline.',
      'the BM25 + dense fusion raises top-20 accuracy on NQ from 78.4 to 82.5',
    ),
  },
  varga_p9: {
    chunk_id: 'chk_varga_0901',
    source_id: 'src_varga2024',
    page: 9,
    section: '5 Discussion',
    ...span(
      'The hybrid configuration from Section 2.2 does not improve over our tuned dense retriever on HotpotQA, suggesting lexical signals matter less for multi-hop questions. Overall, on HotpotQA our tuned dense retriever is within 0.5 points of the hybrid configuration across all retrieval budgets.',
      'on HotpotQA our tuned dense retriever is within 0.5 points of the hybrid configuration',
    ),
  },
  varga_p9_graph: {
    chunk_id: 'chk_varga_0901',
    source_id: 'src_varga2024',
    page: 9,
    section: '5 Discussion',
    ...span(
      'The hybrid configuration from Section 2.2 does not improve over our tuned dense retriever on HotpotQA, suggesting lexical signals matter less for multi-hop questions. Overall, on HotpotQA our tuned dense retriever is within 0.5 points of the hybrid configuration across all retrieval budgets.',
      'The hybrid configuration from Section 2.2 does not improve over our tuned dense retriever on HotpotQA',
    ),
  },
  varga_p3: {
    chunk_id: 'chk_varga_0302',
    source_id: 'src_varga2024',
    page: 3,
    section: '2.2 Experimental setup',
    ...span(
      'We additionally report a hybrid configuration that interpolates BM25 and dense scores with α = 0.3 as a reference point.',
      'interpolates BM25 and dense scores with α = 0.3',
    ),
  },
  ito_p5: {
    chunk_id: 'chk_ito_0501',
    source_id: 'src_ito2025',
    page: 5,
    section: '3 Method',
    ...span(
      'The indexing pipeline extracts entities and relations from each text unit, clusters them into communities with the Leiden algorithm, and pre-generates a summary for every community. We do not tune retrieval hyperparameters for this study.',
      'clusters them into communities with the Leiden algorithm, and pre-generates a summary for every community',
    ),
  },
  daly_p7: {
    chunk_id: 'chk_daly_0701',
    source_id: 'src_daly2025',
    page: 7,
    section: '4.3 Chunk length',
    ...span(
      'Recall@20 drops from 71.2 to 64.8 when chunks grow from 384 to 1,024 tokens on Natural Questions, while a 64-token overlap recovers about one point at every length.',
      'Recall@20 drops from 71.2 to 64.8 when chunks grow from 384 to 1,024 tokens',
    ),
  },
  meyer_p11: {
    chunk_id: 'chk_meyer_1101',
    source_id: 'src_meyer2024',
    page: 11,
    section: '6.1 Chunk length',
    ...span(
      'Chunk length between 256 and 1,024 tokens had no significant effect on nDCG@10 for the late-interaction retriever, because token-level matching already localises the relevant span.',
      'Chunk length between 256 and 1,024 tokens had no significant effect on nDCG@10',
    ),
  },
};
