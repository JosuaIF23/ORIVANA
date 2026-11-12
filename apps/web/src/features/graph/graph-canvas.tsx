import { useMemo } from 'react';
import { Panel, ReactFlow, ReactFlowProvider, useReactFlow, type NodeMouseHandler, type EdgeMouseHandler } from '@xyflow/react';
import '@xyflow/react/dist/base.css';
import { Maximize, Minus, Plus } from 'lucide-react';
import type { Entity, Relationship } from '@contracts/types';
import { forceLayout } from './layout';
import { EntityNode, type EntityFlowNode } from './entity-node';
import { RelationEdge, type RelationFlowEdge } from './relation-edge';
import { ENTITY_TYPE } from '@/components/common/entity-icon';
import { RELATION_LABEL } from '@/lib/relations';

const nodeTypes = { entity: EntityNode };
const edgeTypes = { relation: RelationEdge };

interface Props {
  nodes: Entity[];
  edges: Relationship[];
  selected: string | null;
  find: string;
  onSelect: (id: string | null) => void;
  onExpand: (entityId: string) => void;
}

function Controls() {
  const flow = useReactFlow();
  const btn = 'flex size-9 items-center justify-center text-fg-secondary hover:bg-elevated hover:text-fg';
  return (
    <Panel position="bottom-right" className="!m-4 flex flex-col overflow-hidden rounded-control border border-subtle bg-surface">
      <button type="button" aria-label="Zoom in" className={btn} onClick={() => flow.zoomIn()}>
        <Plus aria-hidden="true" className="size-4" />
      </button>
      <button type="button" aria-label="Zoom out" className={btn} onClick={() => flow.zoomOut()}>
        <Minus aria-hidden="true" className="size-4" />
      </button>
      <button type="button" aria-label="Fit graph to view" className={btn} onClick={() => flow.fitView({ padding: 0.15 })}>
        <Maximize aria-hidden="true" className="size-4" />
      </button>
    </Panel>
  );
}

function Legend() {
  return (
    <Panel position="bottom-left" className="!m-4 flex flex-wrap items-center gap-x-5 gap-y-1 rounded-control border border-subtle bg-surface px-4 py-2 text-xs text-fg-secondary">
      <span className="flex items-center gap-2"><svg width="28" height="6" aria-hidden="true"><line x1="0" y1="3" x2="28" y2="3" stroke="var(--border-control)" strokeWidth="1.5" /></svg>Confirmed</span>
      <span className="flex items-center gap-2"><svg width="28" height="6" aria-hidden="true"><line x1="0" y1="3" x2="28" y2="3" stroke="var(--status-warning)" strokeWidth="1.5" strokeDasharray="5 4" /></svg>Candidate (dashed)</span>
      <span className="flex items-center gap-2"><svg width="28" height="6" aria-hidden="true"><line x1="0" y1="3" x2="28" y2="3" stroke="var(--accent-primary)" strokeWidth="2.5" strokeDasharray="5 4" /></svg>Selected</span>
      <span>Struck-through label = superseded</span>
    </Panel>
  );
}

/** React Flow canvas with deterministic layout; nodes and edges are keyboard-focusable. */
function Canvas({ nodes, edges, selected, find, onSelect, onExpand }: Props) {
  const positions = useMemo(
    () =>
      forceLayout(
        nodes.map((n) => n.id),
        edges.map((e) => ({ source: e.from_entity_id, target: e.to_entity_id })),
        { sizes: new Map(nodes.map((n) => [n.id, n.canonical_name.length * 7.4 + 48])) },
      ),
    // Layout depends only on the structure, not on status changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [nodes.map((n) => n.id).join(), edges.map((e) => e.id).join()],
  );
  const q = find.trim().toLowerCase();
  const flowNodes: EntityFlowNode[] = nodes.map((n) => ({
    id: n.id,
    type: 'entity',
    position: positions.get(n.id) ?? { x: 0, y: 0 },
    data: { entity: n, dimmed: Boolean(q) && !n.canonical_name.toLowerCase().includes(q), matched: Boolean(q) && n.canonical_name.toLowerCase().includes(q) },
    selected: n.id === selected,
    ariaLabel: `${ENTITY_TYPE[n.entity_type].label}: ${n.canonical_name}${n.status === 'superseded' ? ' (superseded)' : ''}`,
  }));
  const names = new Map(nodes.map((n) => [n.id, n.canonical_name]));
  const flowEdges: RelationFlowEdge[] = edges.map((e) => ({
    id: e.id,
    type: 'relation',
    source: e.from_entity_id,
    target: e.to_entity_id,
    data: { relationship: e },
    selected: e.id === selected,
    ariaLabel: `${names.get(e.from_entity_id)} ${RELATION_LABEL[e.relation_type].toLowerCase()} ${names.get(e.to_entity_id)}, ${e.status}`,
  }));

  const onNodeClick: NodeMouseHandler<EntityFlowNode> = (_, node) => onSelect(node.id);
  const onEdgeClick: EdgeMouseHandler<RelationFlowEdge> = (_, edge) => onSelect(edge.id);

  return (
    <ReactFlow
      nodes={flowNodes}
      edges={flowEdges}
      nodeTypes={nodeTypes}
      edgeTypes={edgeTypes}
      onNodeClick={onNodeClick}
      onEdgeClick={onEdgeClick}
      onNodeDoubleClick={(_, node) => onExpand(node.id)}
      onPaneClick={() => onSelect(null)}
      onSelectionChange={({ nodes: ns, edges: es }) => {
        const id = ns[0]?.id ?? es[0]?.id;
        if (id && id !== selected) onSelect(id);
      }}
      nodesDraggable
      nodesConnectable={false}
      elementsSelectable
      fitView
      fitViewOptions={{ padding: 0.12 }}
      minZoom={0.3}
      maxZoom={2}
      attributionPosition="top-right"
      colorMode="dark"
      className="orivana-flow"
      ariaLabelConfig={{ 'node.a11yDescription.default': 'Press Enter to inspect. Double-click to expand one hop.' }}
    >
      <Controls />
      <Legend />
    </ReactFlow>
  );
}

export function GraphCanvas(props: Props) {
  return (
    <ReactFlowProvider>
      <Canvas {...props} />
    </ReactFlowProvider>
  );
}
