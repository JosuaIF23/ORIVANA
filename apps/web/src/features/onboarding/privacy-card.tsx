import { Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { SwitchRow } from '@/components/ui/controls';
import { Skeleton } from '@/components/ui/primitives';
import { StatusBadge } from '@/components/common/status-badge';
import { useConnectGitHub, useConnections, usePreferences, useUpdatePreferences } from './use-onboarding';

/** Privacy and memory controls + optional GitHub connection (UI.md §4.3 step 6). */
export function PrivacyCard() {
  const { data: prefs } = usePreferences();
  const update = useUpdatePreferences();
  const { data: connections } = useConnections();
  const connect = useConnectGitHub();
  const github = connections?.connections.find((c) => c.provider === 'github' && c.status === 'connected');

  return (
    <section aria-labelledby="privacy-title" className="rounded-card border border-subtle bg-surface p-6">
      <h2 id="privacy-title" className="text-lg font-semibold text-fg">
        Privacy and memory
      </h2>
      <p className="mt-1 text-base text-fg-secondary">Your files stay in this private workspace. Change these anytime in Settings → Memory controls.</p>
      {prefs ? (
        <div className="mt-6 flex flex-col gap-5">
          <SwitchRow
            id="pref-suggest"
            label="Suggest memories from my conversations"
            description="Suggestions stay candidates until you confirm them."
            checked={prefs.suggest_memories_from_conversations}
            onCheckedChange={(v) => update.mutate({ suggest_memories_from_conversations: v })}
            disabled={update.isPending}
          />
          <SwitchRow
            id="pref-candidates"
            label="Use unconfirmed candidates in answers"
            description="Off: answers use only confirmed memories and source passages."
            checked={prefs.use_unconfirmed_candidates_in_answers}
            onCheckedChange={(v) => update.mutate({ use_unconfirmed_candidates_in_answers: v })}
            disabled={update.isPending}
          />
        </div>
      ) : (
        <div className="mt-6 flex flex-col gap-4">
          <Skeleton className="h-10" />
          <Skeleton className="h-10" />
        </div>
      )}
      <div className="mt-6 flex flex-wrap items-center gap-4 border-t border-subtle pt-6">
        <span aria-hidden="true" className="flex size-10 items-center justify-center rounded-control bg-elevated font-semibold text-fg">
          G
        </span>
        <p className="min-w-0 flex-1 text-base text-fg-secondary">
          <strong className="font-semibold text-fg">Connect GitHub</strong> to read issues and prepare new ones. Optional — skip it now if you like.
        </p>
        {github ? (
          <StatusBadge status="connected" label={`Connected as ${github.account_label}`} />
        ) : (
          <Button size="sm" onClick={() => connect.mutate()} loading={connect.isPending} loadingText="Connecting…">
            Connect
          </Button>
        )}
        {connect.isSuccess && !github ? <Check aria-hidden="true" className="size-4 text-knowledge" /> : null}
      </div>
    </section>
  );
}
