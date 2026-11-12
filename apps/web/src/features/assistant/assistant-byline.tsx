import { formatTime } from '@/lib/format';
import { LogoMark } from '@/components/common/logo';

/** "ORIVANA · 14:20 · answered from 3 of 14 sources" */
export function AssistantByline({ at, detail }: { at: string | null; detail: string }) {
  return (
    <p className="flex items-center gap-2 text-sm text-fg-secondary">
      <LogoMark className="size-5" />
      <span translate="no" className="font-semibold text-fg-secondary">
        ORIVANA
      </span>
      {at ? <span>· {formatTime(at)}</span> : null}
      <span>· {detail}</span>
    </p>
  );
}
