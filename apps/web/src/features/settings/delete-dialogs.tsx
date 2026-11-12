import { useState } from 'react';
import { Link, useNavigate } from 'react-router';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Trash2 } from 'lucide-react';
import { deleteAccount } from '@/services/auth';
import { deleteWorkspaceData, getDeletionPreview } from '@/services/workspace';
import { qk } from '@/hooks/query-keys';
import { useMe } from '@/hooks/use-session';
import { Button } from '@/components/ui/button';
import { Dialog } from '@/components/ui/dialog';
import { Field, Input } from '@/components/ui/field';
import { LoadingSkeleton } from '@/components/common/states';
import { useToast } from '@/components/common/toast';

const icon = (
  <span className="flex size-12 shrink-0 items-center justify-center rounded-full bg-danger/15 text-danger">
    <Trash2 aria-hidden="true" className="size-5" />
  </span>
);

/** Settings · delete confirmation dialog (design): lists what is deleted and what is not. */
export function DeleteWorkspaceDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (o: boolean) => void }) {
  const { data: me } = useMe();
  const { data: preview } = useQuery({ queryKey: qk.deletionPreview, queryFn: getDeletionPreview, enabled: open });
  const qc = useQueryClient();
  const toast = useToast();
  const navigate = useNavigate();
  const [confirm, setConfirm] = useState('');
  const name = me?.workspace.name ?? '';
  const del = useMutation({
    mutationFn: () => deleteWorkspaceData(confirm),
    onSuccess: () => {
      qc.clear();
      toast.success(`All data in ${name} was deleted`);
      navigate('/home', { replace: true });
    },
  });
  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
      icon={icon}
      title={`Delete all data in ${name}?`}
      description="This can’t be undone. Everything below is permanently removed from ORIVANA, including data derived from your sources."
      footer={
        <>
          <Button size="lg" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button variant="danger-solid" size="lg" disabled={confirm !== name} loading={del.isPending} loadingText="Deleting…" onClick={() => del.mutate()}>
            Delete workspace data
          </Button>
        </>
      }
    >
      {!preview ? <LoadingSkeleton rows={5} /> : (
        <>
          <h3 className="text-sm font-medium text-danger">Permanently deleted</h3>
          <dl className="mt-3 flex flex-col gap-2.5">
            {preview.items.map((i) => (
              <div key={i.key} className="flex justify-between gap-4 text-base">
                <dt className="text-fg">{i.label}</dt>
                <dd className="text-fg-secondary tabular">{i.value}</dd>
              </div>
            ))}
          </dl>
          <div className="mt-5 rounded-card border border-subtle bg-surface p-4">
            <h3 className="text-sm font-medium text-fg-secondary">Not affected</h3>
            <ul className="mt-2 flex list-disc flex-col gap-1.5 pl-5 text-sm text-fg-secondary">
              {preview.not_affected.map((t) => <li key={t}>{t}</li>)}
            </ul>
          </div>
          <p className="mt-5 text-base text-fg-secondary">
            Need a copy first? <Link to="/settings/export" onClick={() => onOpenChange(false)} className="text-accent underline underline-offset-4">Export your data</Link> before continuing.
          </p>
          <Field className="mt-4" label={<>Type <strong className="font-semibold text-fg">{name}</strong> to confirm</>} error={del.error?.message}>
            {({ id, describedBy, invalid }) => <Input id={id} name="confirm-workspace" autoComplete="off" spellCheck={false} value={confirm} onChange={(e) => setConfirm(e.target.value)} aria-describedby={describedBy} aria-invalid={invalid} />}
          </Field>
        </>
      )}
    </Dialog>
  );
}

export function DeleteAccountDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (o: boolean) => void }) {
  const { data: me } = useMe();
  const qc = useQueryClient();
  const navigate = useNavigate();
  const [confirm, setConfirm] = useState('');
  const email = me?.user.email ?? '';
  const del = useMutation({ mutationFn: deleteAccount, onSuccess: () => { qc.clear(); navigate('/sign-in', { replace: true }); } });
  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
      icon={icon}
      title="Delete your account?"
      description="This deletes all workspaces and their data, revokes connected apps, and closes your account. It can’t be undone."
      footer={
        <>
          <Button size="lg" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button variant="danger-solid" size="lg" disabled={confirm !== email} loading={del.isPending} loadingText="Deleting…" onClick={() => del.mutate()}>
            Delete account
          </Button>
        </>
      }
    >
      <Field label={<>Type <strong className="font-semibold text-fg">{email}</strong> to confirm</>} error={del.error?.message}>
        {({ id, describedBy }) => <Input id={id} name="confirm-email" type="email" autoComplete="off" spellCheck={false} value={confirm} onChange={(e) => setConfirm(e.target.value)} aria-describedby={describedBy} />}
      </Field>
    </Dialog>
  );
}
