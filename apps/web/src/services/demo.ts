import { fixtures, type TestAccount } from './core/fixtures';

/**
 * Prototype-only helpers backed by `fixtures/auth/_test-accounts.json`.
 * They are not part of the production API.
 */
export function demoAccount(scenario: TestAccount['scenario']): TestAccount {
  return fixtures.auth.accounts.accounts.find((a) => a.scenario === scenario)!;
}

export function demoToken(kind: 'verify_valid' | 'reset_valid' | 'reset_expired'): string {
  return fixtures.auth.accounts.tokens[kind];
}

/** Sample paper used by "Prototype: use the sample paper" during onboarding. */
export function sampleUpload(): { file_name: string; size_bytes: number } {
  const s = fixtures.sources.upload.source;
  return { file_name: s.file_name, size_bytes: s.size_bytes };
}

/** Default project name suggested in onboarding step 1. */
export function suggestedProjectName(): string {
  return fixtures.projects.create.name;
}
