import { useEffect, useRef } from 'react';
import type { MessageCitation, SourcePageResponse } from '@contracts/types';
import { cn } from '@/lib/cn';
import { EvidencePassage } from '@/components/common/citation';

/** One document page: running header, headings, paragraphs (chunks), tables. */
export function PageView({ page, highlight }: { page: SourcePageResponse; highlight: Pick<MessageCitation, 'chunk_id' | 'char_start' | 'char_end'> | null }) {
  const markRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    markRef.current?.scrollIntoView({ block: 'center' });
  }, [highlight?.chunk_id, page.page]);

  return (
    <article aria-label={`Page ${page.page}`} className="rounded-card border border-subtle bg-surface px-6 py-8 md:px-12 md:py-12">
      <p className="flex justify-between gap-4 text-sm text-fg-secondary">
        <span className="truncate">{page.running_header}</span>
        <span className="tabular">{page.page}</span>
      </p>
      <div className="mt-8 flex flex-col gap-6">
        {page.blocks.map((block, i) => {
          if (block.type === 'heading') {
            return (
              <h2 key={i} className={cn('font-semibold text-fg', block.level === 1 ? 'text-xl' : 'text-lg')}>
                {block.text}
              </h2>
            );
          }
          if (block.type === 'table') {
            return (
              <figure key={i} className="flex flex-col gap-3">
                <figcaption className="text-sm text-fg-secondary">{block.caption}</figcaption>
                <table className="w-full border-collapse text-base">
                  <thead>
                    <tr className="border-b border-control">
                      {block.columns.map((c, j) => (
                        <th key={c} scope="col" className={cn('px-3 py-2 font-semibold text-fg', j > 0 && 'text-right')}>
                          {c}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {block.rows.map((row, r) => (
                      <tr key={r} className="border-b border-subtle last:border-b-0">
                        {row.map((cell, j) => (
                          <td key={j} className={cn('px-3 py-2 tabular', j > 0 ? 'text-right' : 'text-fg-secondary', r === block.emphasis_row && j > 0 ? 'font-semibold text-fg' : 'text-fg-secondary')}>
                            {cell}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </figure>
            );
          }
          const hit = highlight?.chunk_id === block.chunk_id;
          return (
            <div key={i} ref={hit ? markRef : undefined} className="scroll-mt-24">
              <EvidencePassage passage={block.text} start={hit ? highlight.char_start : -1} end={hit ? highlight.char_end : -1} className="text-lg leading-8" />
            </div>
          );
        })}
      </div>
    </article>
  );
}
