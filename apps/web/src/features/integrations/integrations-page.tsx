import { Bot, ShieldCheck } from 'lucide-react';
import type { ProviderCatalogItem } from '@contracts/types';
import { useConnectionsList } from '@/hooks/use-data';
import { PageHeader } from '@/components/common/page-header';
import { ErrorState, LoadingSkeleton } from '@/components/common/states';
import { Card } from '@/components/ui/primitives';
import { StatusBadge } from '@/components/common/status-badge';
import { GitHubCard, ConnectGitHubCard } from './github-card';
import { ConnectZoteroCard, ZoteroCard } from './zotero-card';

const HOW = [
  'We explain which data and repositories will be read.',
  'We request the smallest set of permissions.',
  'You approve on the provider’s own page.',
  'Tokens are stored server-side, never in the browser.',
  'You see exactly what was granted, here.',
];

/** Integrations (UI.md v2 §4.14): Zotero (read only), GitHub, MCP card (coming later), other apps coming later. */
export default function IntegrationsPage() {
  const { data, isPending, error, refetch } = useConnectionsList();
  const zotero = data?.connections.find((c) => c.provider === 'zotero');
  const github = data?.connections.find((c) => c.provider === 'github');
  const mcp = data?.catalog.find((c) => c.provider === 'mcp');
  const later = data?.catalog.filter((c) => c.availability === 'coming_later' && c.provider !== 'mcp') ?? [];
  return (
    <div className="mx-auto flex max-w-[1240px] flex-col gap-8">
      <PageHeader title="Integrations" description="Connected apps and exactly what ORIVANA may do in them. Signing in to ORIVANA never connects an app." />
      {isPending ? (
        <LoadingSkeleton rows={6} label="Loading integrations…" />
      ) : error ? (
        <ErrorState error={error} onRetry={() => refetch()} />
      ) : (
        <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_400px]">
          <div className="flex min-w-0 flex-col gap-6">
            {zotero ? <ZoteroCard connection={zotero} /> : <ConnectZoteroCard />}
            {github ? <GitHubCard connection={github} /> : <ConnectGitHubCard />}
          </div>
          <div className="flex flex-col gap-6">
            {mcp ? <McpConnectCard item={mcp} /> : null}
            {later.map((c) => (
              <Card key={c.provider} className="p-6">
                <div className="flex items-start gap-4">
                  <span aria-hidden="true" className="flex size-12 shrink-0 items-center justify-center rounded-control border border-subtle text-lg font-semibold text-fg">{c.name[0]}</span>
                  <div className="min-w-0 flex-1">
                    <h2 className="text-lg font-semibold text-fg">{c.name}</h2>
                    <p className="text-base text-fg-secondary">{c.tagline}</p>
                  </div>
                  <StatusBadge status="coming_later" size="md" />
                </div>
                {c.workaround ? <p className="mt-4 text-base text-fg-secondary">{c.workaround}</p> : null}
              </Card>
            ))}
            <section aria-labelledby="how-title" className="px-1">
              <h2 id="how-title" className="text-sm font-medium text-fg-secondary">How connecting works</h2>
              <ol className="mt-3 flex list-decimal flex-col gap-2 pl-5 text-base text-fg-secondary">
                {HOW.map((s) => (
                  <li key={s}>{s}</li>
                ))}
              </ol>
            </section>
          </div>
        </div>
      )}
    </div>
  );
}

/** "Use ORIVANA in Claude / ChatGPT" (UI.md §4.14 card 3): coming later in the MVP. */
function McpConnectCard({ item }: { item: ProviderCatalogItem }) {
  return (
    <Card className="p-6">
      <div className="flex items-start gap-4">
        <span aria-hidden="true" className="flex size-12 shrink-0 items-center justify-center rounded-control border border-subtle text-accent">
          <Bot className="size-6" />
        </span>
        <div className="min-w-0 flex-1">
          <h2 className="text-lg font-semibold text-fg">{item.name}</h2>
          <p className="text-base text-fg-secondary">{item.tagline}</p>
        </div>
        <StatusBadge status="coming_later" size="md" />
      </div>
      {item.workaround ? (
        <p className="mt-4 flex gap-2 text-sm text-fg-secondary">
          <ShieldCheck aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-warning" />
          {item.workaround}
        </p>
      ) : null}
    </Card>
  );
}
