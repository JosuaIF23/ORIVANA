import type { ReactNode } from 'react';
import {
  ArrowRightToLine,
  Check,
  CircleDashed,
  Clock,
  Download,
  Pencil,
  ShieldCheck,
  Square,
  TriangleAlert,
  User,
  X,
  Cpu,
} from 'lucide-react';
import type { Origin } from '@contracts/types';
import { cn } from '@/lib/cn';
import { Spinner } from '@/components/ui/spinner';

type Tone = 'knowledge' | 'accent' | 'warning' | 'danger' | 'neutral';

interface StatusDef {
  label: string;
  tone: Tone;
  icon: ReactNode;
  dashed?: boolean;
}

const spin = <Spinner className="size-3.5" />;

/**
 * Every status shows text plus an icon (and a dashed border for candidates),
 * never colour alone (UI.md §6).
 */
export const STATUS: Record<string, StatusDef> = {
  queued: { label: 'Queued', tone: 'neutral', icon: <Clock /> },
  parsing: { label: 'Parsing', tone: 'accent', icon: spin },
  indexing: { label: 'Indexing', tone: 'accent', icon: spin },
  ready: { label: 'Ready', tone: 'knowledge', icon: <Check /> },
  failed: { label: 'Failed', tone: 'danger', icon: <TriangleAlert /> },
  candidate: { label: 'Candidate', tone: 'warning', icon: <CircleDashed />, dashed: true },
  proposed: { label: 'Proposed', tone: 'warning', icon: <CircleDashed />, dashed: true },
  confirmed: { label: 'Confirmed', tone: 'knowledge', icon: <Check /> },
  superseded: { label: 'Superseded', tone: 'neutral', icon: <ArrowRightToLine /> },
  rejected: { label: 'Rejected', tone: 'danger', icon: <X /> },
  active: { label: 'Active', tone: 'knowledge', icon: null },
  archived: { label: 'Archived', tone: 'neutral', icon: null },
  draft: { label: 'Draft', tone: 'neutral', icon: <Pencil /> },
  validating: { label: 'Validating', tone: 'accent', icon: spin },
  awaiting_approval: { label: 'Awaiting approval', tone: 'warning', icon: <Clock /> },
  approved: { label: 'Approved', tone: 'accent', icon: <Check /> },
  executing: { label: 'Executing', tone: 'accent', icon: spin },
  verifying: { label: 'Verifying', tone: 'accent', icon: spin },
  succeeded: { label: 'Succeeded', tone: 'knowledge', icon: <Check /> },
  verified: { label: 'Verified', tone: 'knowledge', icon: <ShieldCheck /> },
  expired: { label: 'Expired', tone: 'neutral', icon: <Clock /> },
  in_progress: { label: 'In progress', tone: 'accent', icon: null },
  connected: { label: 'Connected', tone: 'knowledge', icon: <Check /> },
  needs_reconnect: { label: 'Needs reconnect', tone: 'warning', icon: <TriangleAlert /> },
  revoked: { label: 'Revoked', tone: 'neutral', icon: <X /> },
  low_write: { label: 'Low write', tone: 'warning', icon: <Pencil /> },
  cancelled: { label: 'Cancelled', tone: 'neutral', icon: <Square className="fill-current" /> },
  coming_later: { label: 'Coming later', tone: 'neutral', icon: null },
  link_expired: { label: 'Link expired', tone: 'neutral', icon: null },
  recommended: { label: 'Recommended', tone: 'accent', icon: null },
};

const TONE: Record<Tone, string> = {
  knowledge: 'border-knowledge/50 bg-knowledge/10 text-knowledge',
  accent: 'border-accent/50 bg-accent/10 text-accent',
  warning: 'border-warning/60 bg-warning/10 text-warning',
  danger: 'border-danger/60 bg-danger/10 text-danger',
  neutral: 'border-control/70 bg-elevated text-fg-secondary',
};

interface StatusBadgeProps {
  status: keyof typeof STATUS | string;
  /** Override the visible text (e.g. "Indexing…" or "Cancelled · partial answer"). */
  label?: ReactNode;
  className?: string;
  size?: 'sm' | 'md';
}

export function StatusBadge({ status, label, className, size = 'sm' }: StatusBadgeProps) {
  const def = STATUS[status] ?? { label: status, tone: 'neutral' as Tone, icon: null };
  return (
    <span
      className={cn(
        'inline-flex shrink-0 items-center gap-1.5 rounded-badge border font-medium whitespace-nowrap [&_svg]:size-3.5',
        size === 'sm' ? 'h-6 px-2 text-xs' : 'h-7 px-2.5 text-sm',
        def.dashed && 'border-dashed',
        TONE[def.tone],
        className,
      )}
    >
      {def.icon}
      {label ?? def.label}
    </span>
  );
}

const ORIGIN: Record<Origin, { label: string; icon: ReactNode }> = {
  model_proposed: { label: 'Model-proposed', icon: <Cpu /> },
  user: { label: 'User-created', icon: <User /> },
  imported: { label: 'Imported', icon: <Download /> },
};

/** Who created an AI-related object (UI.md §6). */
export function OriginBadge({ origin, className }: { origin: Origin; className?: string }) {
  const def = ORIGIN[origin];
  return (
    <span className={cn('inline-flex h-6 shrink-0 items-center gap-1.5 rounded-badge border border-control/70 bg-elevated px-2 text-xs whitespace-nowrap text-fg-secondary [&_svg]:size-3.5', className)}>
      {def.icon}
      {def.label}
    </span>
  );
}
