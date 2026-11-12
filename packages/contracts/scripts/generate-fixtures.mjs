// Regenerates packages/contracts/fixtures/**.json.
// Run: node packages/contracts/scripts/generate-fixtures.mjs
import { rmSync } from 'node:fs';
import { FIXTURES_DIR } from './fixtures/lib.mjs';
import { generateSources } from './fixtures/sources.mjs';
import { generateGraph } from './fixtures/graph.mjs';
import { generateConversations } from './fixtures/conversations.mjs';
import { generateMemories } from './fixtures/memories.mjs';
import { generateActions } from './fixtures/actions.mjs';
import { generateAudit } from './fixtures/audit.mjs';
import { generateKnowledge } from './fixtures/knowledge.mjs';
import { generateModelsAndZotero } from './fixtures/models-zotero.mjs';
import { generateAuth, generateMe, generateProjects, generateConnections, generateSearch, generateMisc } from './fixtures/misc.mjs';

rmSync(FIXTURES_DIR, { recursive: true, force: true });
generateAuth();
generateMe();
generateProjects();
generateSources();
generateGraph();
generateConversations();
generateMemories();
generateActions();
generateKnowledge();
generateModelsAndZotero();
const counts = generateAudit();
generateConnections();
generateSearch();
generateMisc();
console.log('Fixtures written to', FIXTURES_DIR);
console.log('Audit counts', counts);
