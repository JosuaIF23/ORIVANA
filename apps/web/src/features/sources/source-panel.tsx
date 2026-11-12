import { useState } from 'react';
import { Link } from 'react-router';
import { Check, RotateCw, X } from 'lucide-react';
import type { SourceDetail } from '@contracts/types';
import { RELATION_LABEL } from '@/lib/relations';
import { cn } from '@/lib/cn';
import { formatBytes, formatDate, formatTime } from '@/lib/format';
import { Button } from '@/components/ui/button';
import { MetaList } from '@/components/ui/primitives';
import { EntityTypeIcon } from '@/components/common/entity-icon';
import { StatusBadge } from '@/components/common/status-badge';
import { DeleteSourceDialog } from './delete-source-dialog';
import { useReprocessSource } from './use-sources';
import { SOURCE_TYPE_LABEL } from '@/lib/labels';

const TYPE = SOURCE_TYPE_LABEL;

/** Metadata, extracted entities, relationships, ingestion history, actions. */
export function SourcePanel({ source: s, className }: { source: SourceDetail; className?: string }) {
  const reprocess = useReprocessSource();
  const [deleting, setDeleting] = useState(false);
  const shown = s.entities.slice(0, 6);
  const more = s.entity_count - shown.length;
  return (
    <aside aria-label="Source details" className={cn('flex flex-col gap-8 border-l border-subtle px-6 py-6', className)}>
      <section>
        <h2 className="text-sm font-medium text-fg-secondary">Source</h2>
        <p className="mt-2 text-lg font-semibold text-fg">{s.title}</p>
        <MetaList
          className="mt-4"
          rows={[
            ['Authors', s.authors ?? '—'],
            ['Year', s.year ?? '—'],
            ['File', [TYPE[s.type], s.page_count ? `${s.page_count} pages` : null, formatBytes(s.size_bytes)].filter(Boolean).join(' · ')],
            ['Project', s.project_id ? <Link to={`/projects/${s.project_id}`} className="text-accent underline underline-offset-4">{s.project_name}</Link> : '—'],
            ['Added', formatDate(s.created_at)],
            ['Checksum', <span className="font-mono text-xs break-all">{s.checksum}</span>],
          ]}
        />
      </section>
      <section>
        <h2 className="text-sm font-medium text-fg-secondary">Extracted entities · {s.entity_count}</h2>
        {shown.length ? (
          <ul className="mt-3 flex flex-wrap gap-2">
            {shown.map((e) => (
              <li key={e.id}>
                <Link to={`/knowledge/map?focus=${e.id}&candidates=1`} className="inline-flex h-9 items-center gap-2 rounded-full border border-control px-3 text-sm text-fg hover:border-fg-muted">
                  <EntityTypeIcon type={e.entity_type} className="size-3.5" />
                  {e.name}
                </Link>
              </li>
            ))}
            {more > 0 ? <li className="inline-flex h-9 items-center rounded-full border border-control px-3 text-sm text-fg-secondary">+{more} more</li> : null}
          </ul>
        ) : (
          <p className="mt-2 text-sm text-fg-muted">{s.status === 'ready' ? 'No entities found yet.' : 'Entities appear once indexing finishes.'}</p>
        )}
      </section>
      <section>
        <h2 className="text-sm font-medium text-fg-secondary">Relationships created · {s.relationship_count}</h2>
        {s.relationships.length ? (
          <ul className="mt-3 flex flex-col gap-3">
            {s.relationships.slice(0, 4).map((r) => (
              <li key={r.id} className="flex items-center justify-between gap-3 text-base text-fg">
                <span>
                  {RELATION_LABEL[r.relation_type]} → {r.target_name}
                </span>
                <StatusBadge status={r.status} />
              </li>
            ))}
          </ul>
        ) : null}
        <Link to={`/knowledge/map?view=list&source=${s.id}&candidates=1`} className="mt-3 inline-block text-sm text-accent underline underline-offset-4 hover:text-fg">
          See all in graph list
        </Link>
      </section>
      <section>
        <h2 className="text-sm font-medium text-fg-secondary">Ingestion history</h2>
        <ol className="mt-3 flex flex-col gap-2.5">
          {s.ingestion_history.map((h, i) => (
            <li key={i} className={cn('flex items-start gap-3 text-sm', h.status === 'failed' ? 'text-fg-secondary' : 'text-fg')}>
              {h.status === 'done' ? <Check aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-knowledge" /> : <X aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-danger" />}
              <span className="flex-1">
                {h.label}
                <span className="sr-only">{h.status === 'failed' ? ' (failed)' : ' (done)'}</span>
              </span>
              <time dateTime={h.at} className="text-fg-muted tabular">{formatTime(h.at)}</time>
            </li>
          ))}
        </ol>
      </section>
      <div className="flex flex-col items-start gap-3 border-t border-subtle pt-6">
        <Button onClick={() => reprocess.mutate(s.id)} loading={reprocess.isPending} loadingText="Reprocessing…">
          <RotateCw aria-hidden="true" />
          Reprocess source
        </Button>
        {reprocess.error ? <p role="alert" className="text-sm text-danger">{reprocess.error.message}</p> : null}
        <Button variant="danger" onClick={() => setDeleting(true)}>
          Delete source…
        </Button>
        <p className="text-sm text-fg-secondary">Deleting removes its chunks, embeddings, graph evidence, and citations in past answers. You’ll confirm first.</p>
      </div>
      <DeleteSourceDialog source={s} open={deleting} onOpenChange={setDeleting} redirect="/knowledge/sources" />
    </aside>
  );
}
