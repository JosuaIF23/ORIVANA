import { memo } from 'react';
import { Handle, Position, type Node, type NodeProps } from '@xyflow/react';
import type { Entity } from '@contracts/types';
import { cn } from '@/lib/cn';
import { EntityTypeIcon, ENTITY_TYPE } from '@/components/common/entity-icon';

export type EntityNodeData = { entity: Entity; dimmed: boolean; matched: boolean };
export type EntityFlowNode = Node<EntityNodeData, 'entity'>;

/** Pill node: type icon (shape) + name; superseded decisions are struck through. */
export const EntityNode = memo(function EntityNode({ data, selected }: NodeProps<EntityFlowNode>) {
  const { entity, dimmed, matched } = data;
  const superseded = entity.status === 'superseded';
  return (
    <div
      className={cn(
        'flex items-center gap-2 rounded-control border bg-surface px-3 py-2 text-sm whitespace-nowrap text-fg transition-opacity',
        selected ? 'border-accent ring-1 ring-accent' : matched ? 'border-warning' : 'border-control/70',
        entity.entity_type === 'project' && 'bg-elevated',
        dimmed && 'opacity-35',
      )}
      title={`${ENTITY_TYPE[entity.entity_type].label}: ${entity.canonical_name}`}
    >
      <Handle type="target" position={Position.Top} className="!size-1 !border-0 !bg-transparent" />
      <EntityTypeIcon type={entity.entity_type} />
      <span className={cn(superseded && 'text-fg-secondary line-through')}>{entity.canonical_name}</span>
      <Handle type="source" position={Position.Bottom} className="!size-1 !border-0 !bg-transparent" />
    </div>
  );
});
