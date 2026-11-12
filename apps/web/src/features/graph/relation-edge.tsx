import { memo, useState } from 'react';
import { BaseEdge, EdgeLabelRenderer, getStraightPath, type Edge, type EdgeProps } from '@xyflow/react';
import type { Relationship } from '@contracts/types';
import { cn } from '@/lib/cn';
import { RELATION_LABEL } from '@/lib/relations';

export type RelationEdgeData = { relationship: Relationship };

/** UI.md §2.3: Supports ✓ (knowledge), Contradicts ✕ (danger), Mentions (secondary). Always labelled. */
const STANCE: Partial<Record<Relationship['relation_type'], { stroke: string; text: string; glyph: string }>> = {
  supports: { stroke: 'var(--accent-knowledge)', text: 'text-knowledge', glyph: '✓' },
  contradicts: { stroke: 'var(--status-danger)', text: 'text-danger', glyph: '✕' },
};
export type RelationFlowEdge = Edge<RelationEdgeData, 'relation'>;

/**
 * Confirmed edges are solid; candidates are dashed with a "Candidate" label
 * (line style + text, not colour alone). The relation type shows on hover/selection.
 */
export const RelationEdge = memo(function RelationEdge({ id, sourceX, sourceY, targetX, targetY, data, selected }: EdgeProps<RelationFlowEdge>) {
  const [hover, setHover] = useState(false);
  const [path, labelX, labelY] = getStraightPath({ sourceX, sourceY, targetX, targetY });
  const rel = data!.relationship;
  const candidate = rel.status === 'candidate';
  const stance = STANCE[rel.relation_type];
  const stroke = selected ? 'var(--accent-primary)' : stance ? stance.stroke : candidate ? 'var(--status-warning)' : 'var(--border-control)';
  const showType = selected || hover || Boolean(stance);
  return (
    <>
      <BaseEdge
        id={id}
        path={path}
        interactionWidth={18}
        style={{ stroke, strokeWidth: selected ? 2.5 : stance ? 1.75 : candidate ? 1.5 : 1.25, strokeDasharray: candidate || selected ? '6 5' : rel.relation_type === 'mentions' ? '1 3' : undefined }}
      />
      <path d={path} fill="none" stroke="transparent" strokeWidth={18} onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)} />
      {candidate || showType ? (
        <EdgeLabelRenderer>
          <div
            style={{ transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)` }}
            className={cn(
              'pointer-events-none absolute rounded-badge border bg-app px-2 py-0.5 text-xs font-medium',
              selected ? 'border-accent text-fg' : candidate ? 'border-dashed border-warning/70 text-warning' : 'border-control text-fg-secondary',
              stance && !selected && stance.text,
            )}
          >
            {stance ? <span aria-hidden="true">{stance.glyph} </span> : null}
            {showType ? RELATION_LABEL[rel.relation_type] : null}
            {showType && candidate ? <span className="text-warning"> · </span> : null}
            {candidate ? <span className="text-warning">Candidate</span> : null}
          </div>
        </EdgeLabelRenderer>
      ) : null}
    </>
  );
});
