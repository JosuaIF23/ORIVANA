import { Library, Circle, Database, Diamond, FileText, Flag, Folder, Hexagon, MessageSquare, ShieldCheck, FileCode, type LucideIcon } from 'lucide-react';
import type { EntityType } from '@contracts/types';
import { cn } from '@/lib/cn';

/** Each node type has its own shape and icon, not colour alone (UI.md §4.6). */
export const ENTITY_TYPE: Record<EntityType, { label: string; plural: string; icon: LucideIcon; color: string }> = {
  paper: { label: 'Paper', plural: 'Papers', icon: FileText, color: 'text-accent' },
  method: { label: 'Method', plural: 'Methods', icon: Circle, color: 'text-knowledge' },
  dataset: { label: 'Dataset', plural: 'Datasets', icon: Database, color: 'text-warning' },
  claim: { label: 'Claim', plural: 'Claims', icon: Diamond, color: 'text-fg' },
  concept: { label: 'Concept', plural: 'Concepts', icon: Hexagon, color: 'text-fg-secondary' },
  project: { label: 'Project', plural: 'Projects', icon: Folder, color: 'text-accent' },
  decision: { label: 'Decision', plural: 'Decisions', icon: Flag, color: 'text-knowledge' },
};

export function EntityTypeIcon({ type, className }: { type: EntityType; className?: string }) {
  const { icon: Icon, color } = ENTITY_TYPE[type];
  return <Icon aria-hidden="true" className={cn('size-4 shrink-0', color, className)} />;
}

const RESULT_ICON: Record<string, { icon: LucideIcon; color: string }> = {
  pdf: { icon: FileText, color: 'text-accent' },
  markdown: { icon: FileCode, color: 'text-accent' },
  zotero: { icon: Library, color: 'text-knowledge' },
  conversation: { icon: MessageSquare, color: 'text-fg-secondary' },
  action: { icon: ShieldCheck, color: 'text-warning' },
};

/** Icon for search results and source rows. */
export function ResultIcon({ icon, className }: { icon: string; className?: string }) {
  if (icon in ENTITY_TYPE) return <EntityTypeIcon type={icon as EntityType} className={className} />;
  const def = RESULT_ICON[icon] ?? RESULT_ICON.pdf;
  const Icon = def.icon;
  return <Icon aria-hidden="true" className={cn('size-4 shrink-0', def.color, className)} />;
}
