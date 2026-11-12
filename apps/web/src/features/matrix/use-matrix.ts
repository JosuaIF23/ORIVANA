import { useCallback, useMemo } from 'react';
import { useSearchParams } from 'react-router';
import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { MatrixQuery, MatrixResponse } from '@contracts/types';
import { getMatrix, getMatrixCell, reviewMatrixRelationship } from '@/services/matrix';
import { qk } from '@/hooks/query-keys';

export function useMatrix(query: MatrixQuery) {
  return useQuery({ queryKey: qk.matrix(query), queryFn: () => getMatrix(query), placeholderData: keepPreviousData });
}

export function useMatrixCell(methodId: string | null, datasetId: string | null) {
  return useQuery({
    queryKey: qk.matrixCell(methodId ?? '', datasetId ?? ''),
    queryFn: () => getMatrixCell(methodId!, datasetId!),
    enabled: Boolean(methodId && datasetId),
  });
}

export function useReviewMatrixRelationship() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: 'confirmed' | 'rejected' }) => reviewMatrixRelationship(id, status),
    onSuccess: () => {
      for (const key of [qk.matrixAll, qk.graphAll, qk.relationships, qk.claimsAll, qk.auditAll, qk.suggestions]) void queryClient.invalidateQueries({ queryKey: key });
    },
  });
}

/** Matrix filters live in the URL so a cell or view can be shared (UI.md §4.7). */
export function useMatrixState(defaultProjectId: string | null) {
  const [params, setParams] = useSearchParams();
  const [method = null, dataset = null] = params.get('cell')?.split('|') ?? [];
  const state = {
    project: params.get('project') ?? defaultProjectId,
    candidates: params.get('candidates') === '1',
    from: params.get('from') ? Number(params.get('from')) : undefined,
    to: params.get('to') ? Number(params.get('to')) : undefined,
    q: params.get('q') ?? '',
    method,
    dataset,
  };
  const set = useCallback(
    (patch: Record<string, string | null>) =>
      setParams(
        (prev) => {
          const next = new URLSearchParams(prev);
          for (const [k, v] of Object.entries(patch)) (v === null || v === '' ? next.delete(k) : next.set(k, v));
          return next;
        },
        { replace: true },
      ),
    [setParams],
  );
  return { state, set };
}

/** Rows and columns after the method/dataset search box. */
export function useVisibleAxes(data: MatrixResponse | undefined, q: string) {
  return useMemo(() => {
    const term = q.trim().toLowerCase();
    if (!data) return { methods: [], datasets: [] };
    if (!term) return { methods: data.methods, datasets: data.datasets };
    const methods = data.methods.filter((m) => m.name.toLowerCase().includes(term));
    const datasets = data.datasets.filter((d) => d.name.toLowerCase().includes(term));
    // A term that matches only datasets keeps every method (and vice versa).
    return { methods: methods.length ? methods : data.methods, datasets: datasets.length ? datasets : data.datasets };
  }, [data, q]);
}

/** CSV of the visible matrix: one row per method, "n papers [1] [2]" or "No evidence" per dataset. */
export function matrixCsv(data: MatrixResponse, methods: MatrixResponse['methods'], datasets: MatrixResponse['datasets']): string {
  const quote = (v: string) => `"${v.replaceAll('"', '""')}"`;
  const header = ['Method', ...datasets.map((d) => d.name)];
  const rows = methods.map((m) => [
    m.name,
    ...datasets.map((d) => {
      const cell = data.cells.find((c) => c.method_id === m.id && c.dataset_id === d.id);
      if (!cell) return 'No evidence';
      const refs = cell.paper_ordinals.map((n) => `[${n}] ${data.papers.find((p) => p.ordinal === n)?.label ?? ''}`).join('; ');
      return `${cell.paper_ordinals.length} paper${cell.paper_ordinals.length === 1 ? '' : 's'}${cell.status === 'candidate' ? ' (candidate)' : ''}: ${refs}`;
    }),
  ]);
  return [header, ...rows].map((r) => r.map(quote).join(',')).join('\n');
}
