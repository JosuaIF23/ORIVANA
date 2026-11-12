import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Download } from 'lucide-react';
import { getExports, startExport } from '@/services/workspace';
import { formatBytes, formatDate } from '@/lib/format';
import { qk } from '@/hooks/query-keys';
import { useMe } from '@/hooks/use-session';
import { Button } from '@/components/ui/button';
import { Select } from '@/components/ui/field';
import { Card } from '@/components/ui/primitives';
import { StatusBadge } from '@/components/common/status-badge';
import { LoadingSkeleton } from '@/components/common/states';

export function DataExport() {
  const { data: me } = useMe();
  const qc = useQueryClient();
  const { data } = useQuery({
    queryKey: qk.exports,
    queryFn: getExports,
    refetchInterval: (q) => (q.state.data?.latest && ['queued', 'running'].includes(q.state.data.latest.status) ? 1000 : false),
  });
  const start = useMutation({ mutationFn: startExport, onSuccess: () => qc.invalidateQueries({ queryKey: qk.exports }) });
  const latest = data?.latest;
  const busy = latest && (latest.status === 'queued' || latest.status === 'running');

  return (
    <div className="mt-2">
      <p className="text-base text-fg-secondary">Download a copy of everything in {me?.workspace.name ?? 'your workspace'}. ORIVANA emails you when it’s ready; the link works for 7 days.</p>
      {!data ? <LoadingSkeleton className="mt-6" rows={3} /> : (
        <Card className="mt-6 p-6">
          <h3 className="text-sm font-medium text-fg-secondary">Included in the export</h3>
          <ul className="mt-3 grid list-disc gap-x-10 gap-y-2 pl-5 text-base text-fg md:grid-cols-2">
            {data.included.map((i) => <li key={i}>{i}</li>)}
          </ul>
          <div className="mt-6 flex flex-wrap items-center gap-4 border-t border-subtle pt-5">
            <label htmlFor="export-format" className="text-sm text-fg-secondary">Format</label>
            <Select id="export-format" className="w-72" defaultValue="zip_json">
              <option value="zip_json">ZIP — JSON + original files</option>
            </Select>
            <Button className="ml-auto" size="lg" onClick={() => start.mutate()} loading={start.isPending || Boolean(busy)} loadingText={busy ? 'Preparing export…' : 'Starting…'}>
              Start export
            </Button>
          </div>
        </Card>
      )}
      {latest ? (
        <p role="status" aria-live="polite" className="mt-4 flex flex-wrap items-center gap-3 text-sm text-fg-secondary">
          {busy ? 'Export in progress — you can leave this page.' : `Last export · ${formatDate(latest.created_at)}${latest.size_bytes ? ` · ${formatBytes(latest.size_bytes)}` : ''}`}
          {latest.status === 'expired' ? <StatusBadge status="link_expired" /> : null}
          {latest.status === 'ready' && latest.download_url ? (
            <a href={latest.download_url} className="inline-flex items-center gap-1.5 text-accent underline underline-offset-4"><Download aria-hidden="true" className="size-4" />Download (link works 7 days)</a>
          ) : null}
        </p>
      ) : null}
      {start.error ? <p role="alert" className="mt-2 text-sm text-danger">{start.error.message}</p> : null}
    </div>
  );
}
