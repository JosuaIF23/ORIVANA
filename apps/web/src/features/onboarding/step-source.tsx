import { useNavigate, useSearchParams } from 'react-router';
import { sampleUpload } from '@/services/demo';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/primitives';
import { UploadDropzone } from '@/components/common/upload-dropzone';
import { InlineAlert } from '@/components/common/states';
import { useSource, useUploadSource } from '@/features/sources/use-sources';
import { IngestionCard } from './ingestion-card';
import { PrivacyCard } from './privacy-card';
import { ZoteroFirstCard } from './zotero-first-card';
import { usePreferences, useProjects } from './use-onboarding';

const EXTRACTS = [
  { title: 'Text with locations', body: 'Page, section, and offsets, so citations land on the right passage.' },
  { title: 'Search index', body: 'Keyword and semantic search across all your sources.' },
  { title: 'Methods, datasets, and claims', body: 'Extracted as candidates — they fill the Matrix and Claims once you review them.' },
];

export function StepSource() {
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();
  const sourceId = params.get('source');
  const { data: prefs } = usePreferences();
  const { data: projects } = useProjects();
  const project = projects?.find((p) => p.id === prefs?.default_project_id) ?? null;
  const upload = useUploadSource();
  const { data: source } = useSource(sourceId);

  function onFile(file: { name: string; size: number }) {
    upload.mutate(
      { file_name: file.name, size_bytes: file.size, project_id: project?.id ?? null },
      { onSuccess: (res) => setParams({ source: res.source.id }, { replace: true }) },
    );
  }

  const nextHref = sourceId ? `/onboarding/question?source=${sourceId}` : '/onboarding/question';

  return (
    <div>
      <p className="text-sm font-medium text-fg-secondary">Step 2 of 3</p>
      <h1 className="mt-3 text-2xl font-semibold text-fg">Add your sources</h1>
      <p className="mt-3 text-lg text-fg-secondary">
        Connect Zotero, or upload a PDF, Markdown, or TXT file. Both are optional.
        {project ? (
          <>
            {' '}
            It will be added to <strong className="font-semibold text-fg">{project.name}</strong>.
          </>
        ) : null}
      </p>

      <div className="mt-8">
        <ZoteroFirstCard projectId={project?.id ?? null} />
      </div>
      <h2 className="mt-8 text-base font-semibold text-fg">Or upload PDFs</h2>
      <UploadDropzone className="mt-3" onFile={onFile} disabled={upload.isPending}>
        <span>
          <strong className="font-semibold text-fg">{source ? 'Drop another file' : 'Drop a file'}</strong> or click to browse
        </span>
      </UploadDropzone>
      {!source ? (
        <button type="button" onClick={() => onFile({ name: sampleUpload().file_name, size: sampleUpload().size_bytes })} disabled={upload.isPending} className="mt-3 rounded-control text-sm text-accent underline underline-offset-4 hover:text-fg">
          Prototype: use the sample paper
        </button>
      ) : null}
      {upload.error ? (
        <InlineAlert tone="danger" className="mt-4" title="Upload failed" live>
          {upload.error.message}
        </InlineAlert>
      ) : null}
      {source ? <div className="mt-6"><IngestionCard source={source} /></div> : null}

      <h2 className="mt-10 text-lg font-semibold text-fg">What ORIVANA extracts</h2>
      <ul className="mt-4 grid gap-4 md:grid-cols-3">
        {EXTRACTS.map((item) => (
          <li key={item.title}>
            <Card className="h-full p-5">
              <p className="font-semibold text-fg">{item.title}</p>
              <p className="mt-1 text-base text-fg-secondary">{item.body}</p>
            </Card>
          </li>
        ))}
      </ul>

      <div className="mt-8">
        <PrivacyCard />
      </div>

      <div className="mt-10 flex flex-wrap items-center gap-4 border-t border-subtle pt-8">
        <Button variant="ghost" size="lg" onClick={() => navigate('/onboarding/welcome')}>
          Back
        </Button>
        {source && source.status !== 'ready' ? <span className="ml-auto text-sm text-fg-secondary">Indexing continues in the background</span> : <span className="ml-auto" />}
        <Button variant="ghost" size="lg" onClick={() => navigate('/onboarding/question')}>
          Skip for now
        </Button>
        <Button variant="primary" size="lg" onClick={() => navigate(nextHref)}>
          Continue to first question
        </Button>
      </div>
    </div>
  );
}
