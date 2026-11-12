import type { RelationType } from '@contracts/types';

export const RELATION_LABEL: Record<RelationType, string> = {
  uses_method: 'Uses method',
  evaluates_on: 'Evaluates on',
  supports: 'Supports',
  contradicts: 'Contradicts',
  mentions: 'Mentions',
  supersedes: 'Supersedes',
  derived_from: 'Derived from',
  contains: 'Contains',
};

/** Lowercase verb used in sentences: "Varga & Chen 2024 uses method Hybrid retrieval". */
export function relationVerb(type: RelationType): string {
  return RELATION_LABEL[type].toLowerCase();
}

export const RELATION_TYPES = Object.keys(RELATION_LABEL) as RelationType[];
