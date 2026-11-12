import type { ReactNode } from 'react';
import { Link } from 'react-router';
import { Bell, Ban, Pencil, Plus } from 'lucide-react';
import type { ActionProposal, CreateIssueArguments } from '@contracts/types';
import { formatDayMonth } from '@/lib/format';
import { CitationChip } from '@/components/common/citation';
import { StatusBadge } from '@/components/common/status-badge';

function Fact({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div>
      <dt className="text-sm text-fg-secondary">{label}</dt>
      <dd className="mt-1.5 text-base text-fg">{children}</dd>
    </div>
  );
}

export function FactsGrid({ proposal: p }: { proposal: ActionProposal }) {
  return (
    <dl className="grid gap-6 rounded-card border border-subtle bg-surface p-5 sm:grid-cols-3">
      <Fact label="Target app & account">
        <span className="flex items-center gap-2">
          <span aria-hidden="true" className="flex size-6 items-center justify-center rounded-badge bg-elevated text-xs font-semibold">G</span>
          GitHub · <span className="font-mono text-sm">{p.target.account}</span>
        </span>
      </Fact>
      <Fact label="Action">{p.action_label}</Fact>
      <Fact label="Risk tier">
        <StatusBadge status={p.risk_level} />
      </Fact>
      <Fact label="Repository">
        <span className="font-mono text-sm">{p.arguments.repository}</span> <span className="text-sm text-fg-secondary">· {p.target.visibility}</span>
      </Fact>
      <Fact label="Required permission">
        {p.required_permission.label} <span className="text-sm text-fg-secondary">· granted {formatDayMonth(p.required_permission.granted_at)}</span>
      </Fact>
      <Fact label="Project">
        {p.project_id ? (
          <Link to={`/projects/${p.project_id}`} className="text-accent underline underline-offset-4 hover:text-fg">
            {p.project_name}
          </Link>
        ) : (
          '—'
        )}
      </Fact>
    </dl>
  );
}

/** Renders the issue body as GitHub would: headings, bullets, task checkboxes. */
function IssueBody({ body }: { body: string }) {
  return (
    <div className="flex flex-col gap-2 text-base text-fg">
      {body.split('\n').map((line, i) => {
        if (line.startsWith('## ')) return <h4 key={i} className="mt-3 font-semibold text-fg first:mt-0">{line.slice(3)}</h4>;
        const task = line.match(/^- \[( |x)\] (.*)$/);
        if (task) {
          return (
            <p key={i} className="flex items-center gap-2 text-fg">
              <span aria-hidden="true" className="inline-block size-3.5 rounded-[3px] border border-fg-secondary" />
              <span className="sr-only">Task:</span>
              {task[2]}
            </p>
          );
        }
        if (line.startsWith('- ')) return <p key={i} className="pl-5 before:mr-2 before:-ml-4 before:content-['•']">{line.slice(2)}</p>;
        return line ? <p key={i}>{line}</p> : null;
      })}
    </div>
  );
}

export function IssuePreview({ args }: { args: CreateIssueArguments }) {
  return (
    <section aria-labelledby="preview-title">
      <div className="flex items-baseline justify-between gap-4">
        <h3 id="preview-title" className="text-sm font-medium text-fg-secondary">Exact content to be sent — rendered preview</h3>
        <span className="text-sm text-fg-secondary">As it will appear on GitHub</span>
      </div>
      <div className="mt-3 rounded-card border border-subtle bg-surface p-6">
        <p className="text-xl font-semibold text-fg">{args.title}</p>
        {args.labels.length ? (
          <ul className="mt-3 flex flex-wrap gap-2">
            {args.labels.map((l) => (
              <li key={l} className="rounded-full border border-control px-3 py-0.5 text-sm text-fg-secondary">{l}</li>
            ))}
          </ul>
        ) : null}
        <hr className="my-5 border-subtle" />
        <IssueBody body={args.body} />
      </div>
    </section>
  );
}

export function RawFields({ proposal: p }: { proposal: ActionProposal }) {
  const preview = {
    tool: p.tool,
    repository: p.arguments.repository,
    title: p.arguments.title,
    body: p.arguments.body.length > 70 ? `${p.arguments.body.slice(0, 70).replaceAll('\n', '\\n')}… (${p.arguments.body.length} chars)` : p.arguments.body,
    labels: p.arguments.labels,
    assignees: p.arguments.assignees,
    idempotency_key: p.idempotency_key,
  };
  return (
    <section aria-labelledby="raw-title">
      <h3 id="raw-title" className="text-sm font-medium text-fg-secondary">Raw fields</h3>
      <pre className="mt-3 overflow-x-auto rounded-card border border-subtle bg-surface p-5 font-mono text-xs leading-6 text-fg-secondary">{JSON.stringify(preview, null, 2)}</pre>
    </section>
  );
}

export function EvidenceUsed({ proposal: p }: { proposal: ActionProposal }) {
  if (!p.citations.length) return null;
  return (
    <section aria-labelledby="evidence-title">
      <h3 id="evidence-title" className="text-sm font-medium text-fg-secondary">Evidence used ({p.citations.length} citations)</h3>
      <ul className="mt-3 overflow-hidden rounded-card border border-subtle">
        {p.citations.map((c) => (
          <li key={c.ordinal} className="border-b border-subtle last:border-b-0">
            <Link to={`/knowledge/sources/${c.source_id}?page=${c.page}`} className="flex items-center gap-4 bg-surface px-4 py-3 hover:bg-elevated/60">
              <CitationChip ordinal={c.ordinal} />
              <span className="min-w-0 flex-1 truncate text-base text-fg">{c.source_title}</span>
              <span className="text-sm text-fg-secondary">p. {c.page} · §{c.section}</span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}

const EFFECT = { creates: <Plus className="text-warning" />, notifies: <Bell className="text-fg-secondary" />, unchanged: <Ban className="text-knowledge" /> };

export function SideEffects({ proposal: p }: { proposal: ActionProposal }) {
  return (
    <section aria-labelledby="effects-title">
      <h3 id="effects-title" className="text-sm font-medium text-fg-secondary">Expected side effects</h3>
      <ul className="mt-3 flex flex-col gap-2">
        {p.side_effects.map((e) => (
          <li key={e.text} className="flex items-center gap-3 text-base text-fg [&_svg]:size-4">
            <span aria-hidden="true">{EFFECT[e.kind]}</span>
            {e.text.replace('lab/rag-experiments', p.arguments.repository)}
          </li>
        ))}
      </ul>
    </section>
  );
}

export { Pencil };
