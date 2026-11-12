import type { CreateProjectRequest, Project, ProjectDetail, UpdateProjectRequest } from '@contracts/types';
import { nowIso } from '@/lib/clock';
import { fixtures } from './core/fixtures';
import { fail, failWith, simulate } from './core/http';
import { requireDb } from './core/session';

function toSummary(p: ProjectDetail): Project {
  const { current_status: _s, recent_changes: _r, ...rest } = p;
  return rest;
}

/** GET /api/v1/projects */
export function listProjects(): Promise<Project[]> {
  return simulate(() => {
    const db = requireDb();
    return db.projects.map((p) => {
      p.counts.pending_actions = db.proposals.filter((x) => x.project_id === p.id && x.status === 'awaiting_approval').length;
      p.counts.sources = db.sources.filter((s) => s.project_id === p.id).length || p.counts.sources;
      return toSummary(p);
    });
  }, { ms: 260 });
}

/** GET /api/v1/projects/{id} */
export function getProject(id: string): Promise<ProjectDetail> {
  return simulate(() => {
    const project = requireDb().projects.find((p) => p.id === id);
    if (!project) fail(fixtures.projects.notFound);
    return project;
  }, { ms: 300 });
}

/** POST /api/v1/projects */
export function createProject(request: CreateProjectRequest): Promise<Project> {
  return simulate(() => {
    const db = requireDb();
    const name = request.name.trim();
    if (!name) failWith('VALIDATION_FAILED', 'Give the project a name.', { field: 'name' });
    const created: ProjectDetail = {
      ...structuredClone(fixtures.projects.create),
      id: `prj_${name.toLowerCase().replace(/[^a-z0-9]+/g, '_').slice(0, 20)}_${db.projects.length + 1}`,
      workspace_id: db.me.workspace.id,
      name,
      description: request.description ?? '',
      created_at: nowIso(),
      updated_at: nowIso(),
      current_status: { text: 'No decisions yet. Add a source and ask a question to get started.', based_on_memory_id: null, based_on_label: '' },
      recent_changes: [{ at: nowIso(), text: 'Project created' }],
    };
    db.projects.unshift(created);
    if (!db.preferences.default_project_id) db.preferences.default_project_id = created.id;
    return toSummary(created);
  });
}

/** PATCH /api/v1/projects/{id} */
export function updateProject(id: string, patch: UpdateProjectRequest): Promise<Project> {
  return simulate(() => {
    const project = requireDb().projects.find((p) => p.id === id);
    if (!project) fail(fixtures.projects.notFound);
    Object.assign(project, patch, { updated_at: nowIso() });
    return toSummary(project);
  });
}
