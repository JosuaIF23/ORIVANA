import { useCallback } from 'react';
import { useSearchParams } from 'react-router';
import type { EntityType, RelationType } from '@contracts/types';
import { RELATION_TYPES } from '@/lib/relations';

export const ENTITY_TYPES: EntityType[] = ['paper', 'method', 'dataset', 'claim', 'concept', 'project', 'decision'];

/** All graph UI state lives in the URL so views are shareable (deep links). */
export function useGraphState() {
  const [params, setParams] = useSearchParams();
  const list = (key: string) => params.get(key)?.split(',').filter(Boolean) ?? null;
  const state = {
    view: params.get('view') === 'list' ? ('list' as const) : ('graph' as const),
    focus: params.get('focus'),
    depth: params.get('depth') === '1' ? (1 as const) : (2 as const),
    candidates: params.get('candidates') === '1',
    confirmed: params.get('confirmed') !== '0',
    types: (list('types') as EntityType[] | null) ?? ENTITY_TYPES,
    relations: (list('rel') as RelationType[] | null) ?? RELATION_TYPES,
    project: params.get('project') ?? 'prj_rag',
    source: params.get('source'),
    since: params.get('since'),
    selected: params.get('sel'),
    find: params.get('q') ?? '',
    page: Math.max(1, Number(params.get('page') ?? 1)),
  };

  const set = useCallback(
    (patch: Record<string, string | null>) =>
      setParams(
        (p) => {
          for (const [k, v] of Object.entries(patch)) {
            if (v === null || v === '') p.delete(k);
            else p.set(k, v);
          }
          return p;
        },
        { replace: true },
      ),
    [setParams],
  );

  return { state, set, params };
}

export type GraphState = ReturnType<typeof useGraphState>['state'];
