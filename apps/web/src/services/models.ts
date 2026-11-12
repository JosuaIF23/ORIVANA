import type { AnswerModel, ModelsResponse } from '@contracts/types';
import { fixtures } from './core/fixtures';
import { simulate } from './core/http';
import { requireDb } from './core/session';
import type { MockDb } from './core/store';

/** GET /api/v1/models — allowed answer models plus the system-managed ones (PRD §8.9). */
export function getModels(): Promise<ModelsResponse> {
  return simulate(() => {
    requireDb();
    return fixtures.models;
  }, { ms: 260 });
}

/** The model new answers use: the user's preference, else the server default. */
export function answerModelFor(db: MockDb): AnswerModel {
  const models = fixtures.models.answer_models;
  return models.find((m) => m.id === db.preferences.answer_model) ?? models.find((m) => m.is_default) ?? models[0];
}
