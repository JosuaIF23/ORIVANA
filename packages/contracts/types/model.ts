import type { Id } from './common';

/** One allowed answer model (GET /api/v1/models, PRD §8.9, §11.4). */
export interface AnswerModel {
  id: Id;
  name: string;
  provider: string;
  tier: 'fast' | 'strong';
  description: string;
  is_default: boolean;
}

/** System-managed models, shown read-only in Settings. */
export interface ManagedModel {
  task: 'extraction' | 'embeddings' | 'decision_impact';
  name: string;
  provider: string;
}

export interface ModelsResponse {
  answer_models: AnswerModel[];
  managed: ManagedModel[];
  /** AI providers that may process workspace data (transparency list). */
  providers: Array<{ name: string; purpose: string }>;
}
