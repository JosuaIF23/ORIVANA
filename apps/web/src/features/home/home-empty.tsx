import { useNavigate } from 'react-router';
import { Lock } from 'lucide-react';
import { Card } from '@/components/ui/primitives';
import { UploadDropzone } from '@/components/common/upload-dropzone';
import { InlineAlert } from '@/components/common/states';
import { TextLinkInline } from './text-link-inline';
import { useUploadSource } from '@/features/sources/use-sources';
import { usePreferences } from '@/features/onboarding/use-onboarding';
import { ZoteroFirstCard } from '@/features/onboarding/zotero-first-card';

const NEXT = [
  'We extract the text with page numbers and section headings, so every answer can point to its source.',
  'We index it for keyword and semantic search. You will see the status while this runs.',
];

/** Home for a new user (UI.md v2 §4.4): "Connect Zotero or upload your first paper", with both actions. */
export function HomeEmpty({ firstName }: { firstName: string | null }) {
  const navigate = useNavigate();
  const upload = useUploadSource();
  const { data: prefs } = usePreferences();
  return (
    <div className="mx-auto max-w-[760px] py-4">
      <h1 className="text-2xl font-semibold text-fg">Welcome to ORIVANA{firstName ? `, ${firstName}` : ''}</h1>
      <p className="mt-3 text-lg text-fg-secondary">Your workspace is empty. Connect Zotero or upload your first paper, then ask questions with page-level citations.</p>
      <div className="mt-10">
        <ZoteroFirstCard projectId={prefs?.default_project_id ?? null} />
      </div>
      <Card className="mt-6 p-8">
        <h2 className="text-xl font-semibold text-fg">Or upload your first paper</h2>
        <p className="mt-3 text-base text-fg-secondary">PDF, Markdown, or TXT. Obsidian notes work as Markdown files.</p>
        <UploadDropzone
          size="large"
          className="mt-6"
          disabled={upload.isPending}
          onFile={(file) => upload.mutate({ file_name: file.name, size_bytes: file.size, project_id: prefs?.default_project_id ?? null }, { onSuccess: (res) => navigate(`/knowledge/sources?highlight=${res.source.id}`) })}
        >
          <span className="text-lg font-semibold text-fg">Drop a file here, or browse</span>
          <span className="text-sm text-fg-secondary">One file at a time for now · you can add more later</span>
          <span className="inline-flex h-10 items-center rounded-control bg-accent px-5 text-base font-medium text-on-accent">{upload.isPending ? 'Uploading…' : 'Browse files'}</span>
        </UploadDropzone>
        {upload.error ? (
          <InlineAlert tone="danger" className="mt-4" title="Upload failed" live>
            {upload.error.message}
          </InlineAlert>
        ) : null}
        <h3 className="mt-8 text-sm font-medium text-fg-secondary">What happens next</h3>
        <ol className="mt-4 flex flex-col gap-4">
          {[...NEXT, null].map((text, i) => (
            <li key={i} className="flex gap-4 text-base text-fg">
              <span aria-hidden="true" className="flex size-8 shrink-0 items-center justify-center rounded-full border border-control text-sm text-fg-secondary">
                {i + 1}
              </span>
              <span>
                {text ?? (
                  <>
                    We propose methods, datasets, and claims as <strong className="font-semibold">candidates</strong>. Nothing becomes a confirmed fact until you review it.
                  </>
                )}
              </span>
            </li>
          ))}
        </ol>
        <p className="mt-8 flex gap-3 border-t border-subtle pt-6 text-sm text-fg-secondary">
          <Lock aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
          <span>
            Files stay in your private workspace and are never sent to connected apps. Connecting GitHub is optional — you can do it later in <TextLinkInline to="/integrations">Integrations</TextLinkInline>.
          </span>
        </p>
      </Card>
    </div>
  );
}
