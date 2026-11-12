import { useSearchParams } from 'react-router';
import { Quote, Search } from 'lucide-react';
import type { ClaimSort, ClaimStatus } from '@contracts/types';
import { useProjectsList } from '@/hooks/use-data';
import { useIsMobile } from '@/hooks/use-media-query';
import { ButtonLink } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/controls';
import { Dialog } from '@/components/ui/dialog';
import { Input, Select } from '@/components/ui/field';
import { EmptyState, ErrorState, LoadingSkeleton } from '@/components/common/states';
import { KnowledgeHeader } from '@/features/sources/knowledge-header';
import { usePreferences } from '@/features/onboarding/use-onboarding';
import { ClaimCard } from './claim-card';
import { ClaimInspector } from './claim-inspector';
import { useClaims } from './use-claims';

const SORTS: Array<[ClaimSort, string]> = [
  ['most_contested', 'Most contested'],
  ['most_supported', 'Most supported'],
  ['used_by_decisions', 'Used by decisions'],
  ['newest', 'Newest'],
];

/** Knowledge → Claims (UI.md §4.8): which claims are supported or contradicted, and which decisions rely on them. */
export default function ClaimsPage() {
  const [params, setParams] = useSearchParams();
  const { data: prefs } = usePreferences();
  const { data: projects = [] } = useProjectsList();
  const isMobile = useIsMobile();
  const project = params.get('project') ?? prefs?.default_project_id ?? projects[0]?.id ?? undefined;
  const sort = (params.get('sort') as ClaimSort) || 'most_contested';
  const status = (params.get('status') as ClaimStatus) || undefined;
  const contested = params.get('contested') === '1';
  const q = params.get('q') ?? '';
  const selected = params.get('claim');
  const claims = useClaims({ project_id: project, sort, status, has_contradictions: contested || undefined, q: q || undefined });
  const set = (patch: Record<string, string | null>) =>
    setParams((prev) => {
      const next = new URLSearchParams(prev);
      for (const [k, v] of Object.entries(patch)) (v ? next.set(k, v) : next.delete(k));
      return next;
    }, { replace: true });

  const inspector = <ClaimInspector key={selected ?? 'none'} id={selected} onClose={() => set({ claim: null })} />;

  return (
    <div className="flex min-h-[calc(100dvh-var(--topbar-height))] flex-col">
      <KnowledgeHeader />
      <div className="grid min-h-0 flex-1 md:grid-cols-[minmax(320px,1fr)_minmax(0,1fr)] xl:grid-cols-[minmax(380px,1fr)_minmax(0,1.5fr)]">
        <section aria-labelledby="claims-title" className="min-w-0 px-4 py-6 md:px-8">
          <h2 id="claims-title" className="text-lg font-semibold text-fg">
            Claims
          </h2>
          <p className="mt-1 text-sm text-fg-secondary">What your papers claim, which ones agree or disagree, and which decisions depend on it.</p>
          <div className="mt-5 flex flex-wrap items-end gap-3">
            <Select aria-label="Project" value={project ?? ''} onChange={(e) => set({ project: e.target.value, claim: null })} className="w-44">
              {projects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </Select>
            <Select aria-label="Sort claims" value={sort} onChange={(e) => set({ sort: e.target.value })} className="w-44">
              {SORTS.map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </Select>
            <Select aria-label="Status" value={status ?? ''} onChange={(e) => set({ status: e.target.value || null })} className="w-36">
              <option value="">Any status</option>
              <option value="candidate">Candidate</option>
              <option value="confirmed">Confirmed</option>
            </Select>
            <label className="flex h-10 items-center gap-2 text-sm text-fg">
              <Checkbox checked={contested} onCheckedChange={(v) => set({ contested: v ? '1' : null })} />
              Has contradictions
            </label>
            <div className="relative min-w-48 flex-1">
              <Search aria-hidden="true" className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-fg-muted" />
              <Input type="search" name="claims-search" autoComplete="off" aria-label="Search claims" placeholder="Search claims…" value={q} onChange={(e) => set({ q: e.target.value || null })} className="pl-9" />
            </div>
          </div>
          <div className="mt-6">
            {claims.isPending ? (
              <LoadingSkeleton rows={5} label="Loading claims…" />
            ) : claims.error ? (
              <ErrorState error={claims.error} onRetry={() => claims.refetch()} />
            ) : claims.data.items.length === 0 ? (
              q || status || contested ? (
                <EmptyState title="No claims match these filters" description="Clear the search or filters to see every claim." />
              ) : (
                <EmptyState icon={<Quote />} title="No claims yet" description="Claims appear after extraction. Import or upload papers to start." action={<ButtonLink to="/knowledge/sources?upload=1">Add papers</ButtonLink>} />
              )
            ) : (
              <ul className="flex flex-col gap-3" aria-live="polite" aria-label={`${claims.data.total} claims`}>
                {claims.data.items.map((c) => (
                  <li key={c.id}>
                    <ClaimCard claim={c} selected={c.id === selected} onSelect={() => set({ claim: c.id })} />
                  </li>
                ))}
              </ul>
            )}
          </div>
        </section>
        <aside aria-label="Claim evidence" className="hidden min-h-0 border-l border-subtle bg-app md:block">
          <div className="sticky top-[var(--topbar-height)] h-[calc(100dvh-var(--topbar-height))]">{inspector}</div>
        </aside>
      </div>
      <Dialog open={isMobile && Boolean(selected)} onOpenChange={(o) => !o && set({ claim: null })} title="Claim evidence" className="md:hidden">
        {inspector}
      </Dialog>
    </div>
  );
}
